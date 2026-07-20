import React, { useEffect, useMemo, useState } from 'react';
import { ImageOff, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { ProductGridSkeleton } from '../../components/ui/Skeleton';
import PRODUCT_IMAGES from '../../data/productImages';
import { createProduct, deleteProduct, fetchAllProductsForAdmin, updateProduct } from '../../lib/products';
import { BRANDS, BRAND_BY_VALUE } from '../../lib/brands';

// Suggestions only (via <datalist>) — not an enum. Category is a free-text
// column; Shop.jsx groups anything unrecognized under its own name rather
// than breaking, so a brand-new category here is safe, just ungrouped.
const KNOWN_CATEGORIES = ['Face Care', 'Treatment', 'Weekly Care', 'Body Care', 'Hair Care', 'Lip Care'];

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

const emptyForm = {
  id: '',
  brand: 'miracle_natural',
  name: '',
  category: '',
  size: '',
  price: '',
  compareAtPrice: '',
  discountPercent: '',
  moq: '',
  imageUrl: '',
  description: '',
  ingredients: '',
  benefits: '',
  isActive: true,
};

const slugify = (value) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const loadProducts = () => {
    setIsLoading(true);
    setError(null);
    return fetchAllProductsForAdmin()
      .then(setProducts)
      .catch((fetchError) => setError(fetchError.message || 'Could not load products.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (statusFilter === 'active' && !product.is_active) return false;
      if (statusFilter === 'inactive' && product.is_active) return false;
      if (brandFilter !== 'all' && product.brand !== brandFilter) return false;
      if (searchTerm.trim() && !product.name.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [products, statusFilter, brandFilter, searchTerm]);

  const activeCount = useMemo(() => products.filter((p) => p.is_active).length, [products]);
  const inactiveCount = products.length - activeCount;

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditingId(product.id);
    setForm({
      id: product.id,
      brand: product.brand || 'miracle_natural',
      name: product.name,
      category: product.category,
      size: product.size || '',
      price: String(product.price),
      compareAtPrice: product.compare_at_price === null || product.compare_at_price === undefined ? '' : String(product.compare_at_price),
      // Derived purely for display — lets an admin editing an existing sale
      // see it expressed as a percentage instead of two raw prices.
      discountPercent:
        product.compare_at_price && product.price
          ? String(Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100))
          : '',
      moq: product.moq === null || product.moq === undefined ? '' : String(product.moq),
      imageUrl: product.image_url || '',
      description: product.description || '',
      ingredients: product.ingredients || '',
      benefits: product.benefits || '',
      isActive: product.is_active,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  // Escape closes the modal, same as the storefront's ProductDetailModal.
  useEffect(() => {
    if (!formOpen) return undefined;
    const handleEsc = (event) => {
      if (event.key === 'Escape') closeForm();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [formOpen]);

  // Discount % is a manual-sale helper, not a stored field — it just
  // back-calculates the Compare-at Price so an admin can type "20% off"
  // instead of doing the math themselves. Compare-at Price stays editable
  // directly too; this only overwrites it while a valid % is present.
  useEffect(() => {
    if (!formOpen || !form.discountPercent.trim()) return;
    const discount = Number(form.discountPercent);
    const price = Number(form.price);
    if (!Number.isFinite(discount) || discount <= 0 || discount >= 100) return;
    if (!Number.isFinite(price) || price <= 0) return;

    const computedCompareAt = String(Math.round(price / (1 - discount / 100)));
    setForm((prev) => (prev.compareAtPrice === computedCompareAt ? prev : { ...prev, compareAtPrice: computedCompareAt }));
  }, [formOpen, form.discountPercent, form.price]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }
    if (!form.category.trim()) {
      setFormError('Please enter a category.');
      return;
    }
    const priceNumber = Number(form.price);
    if (!form.price || Number.isNaN(priceNumber) || priceNumber < 0) {
      setFormError('Please enter a valid price.');
      return;
    }

    let compareAtPriceNumber = null;
    if (form.compareAtPrice.trim()) {
      compareAtPriceNumber = Number(form.compareAtPrice);
      if (Number.isNaN(compareAtPriceNumber) || compareAtPriceNumber <= priceNumber) {
        setFormError('Compare-at price must be a number greater than the regular price (or left blank).');
        return;
      }
    }

    let moqNumber = null;
    if (form.moq.trim()) {
      moqNumber = Number(form.moq);
      if (!Number.isInteger(moqNumber) || moqNumber <= 0) {
        setFormError('Minimum order quantity must be a whole number greater than 0 (or left blank).');
        return;
      }
    }

    const payload = {
      brand: form.brand,
      name: form.name.trim(),
      category: form.category.trim(),
      size: form.size.trim(),
      price: priceNumber,
      compareAtPrice: compareAtPriceNumber,
      moq: moqNumber,
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim(),
      ingredients: form.ingredients.trim(),
      benefits: form.benefits.trim(),
      isActive: form.isActive,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        const id = slugify(form.id || form.name);
        if (!id) {
          setFormError('Please enter a valid product ID (letters, numbers, hyphens).');
          setIsSaving(false);
          return;
        }
        await createProduct({ ...payload, id });
      }
      closeForm();
      await loadProducts();
    } catch (submitError) {
      if (submitError?.code === '23505') {
        setFormError('A product with that ID already exists. Try a different one.');
      } else {
        setFormError('Could not save this product. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await updateProduct(product.id, {
        brand: product.brand,
        name: product.name,
        category: product.category,
        size: product.size,
        price: Number(product.price),
        compareAtPrice: product.compare_at_price === null || product.compare_at_price === undefined ? null : Number(product.compare_at_price),
        moq: product.moq === null || product.moq === undefined ? null : Number(product.moq),
        imageUrl: product.image_url,
        description: product.description,
        ingredients: product.ingredients,
        benefits: product.benefits,
        isActive: !product.is_active,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch {
      // Silently ignore — a stale row would show back to its real state on
      // next refresh, and this is a quick toggle, not a form submission.
    }
  };

  const handleDelete = async (product) => {
    setDeleteError(null);
    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setPendingDeleteId(null);
    } catch (deleteErrorCaught) {
      // 23503: still referenced by a bundle — the DB's foreign key on
      // bundle_items has no ON DELETE action, so it blocks this on purpose.
      if (deleteErrorCaught?.code === '23503') {
        setDeleteError(`"${product.name}" is still part of a bundle — remove it from that bundle first, then delete it.`);
      } else {
        setDeleteError(deleteErrorCaught?.message || 'Could not delete this product.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h2" className="text-foreground text-balance">
              Product Management
            </Typography>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" onClick={loadProducts} icon={RefreshCw}>
                Refresh
              </Button>
              {!formOpen && (
                <Button className="px-3 py-2 text-[0.72rem]" onClick={openAddForm} icon={Plus}>
                  Add Product
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${statusFilter === status ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
                >
                  {status === 'all' ? `All (${products.length})` : status === 'active' ? `Active (${activeCount})` : `Inactive (${inactiveCount})`}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setBrandFilter('all')}
                className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${brandFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
              >
                All Storefronts
              </button>
              {BRANDS.map((entry) => (
                <button
                  key={entry.brand}
                  type="button"
                  onClick={() => setBrandFilter(entry.brand)}
                  className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${brandFilter === entry.brand ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
                >
                  {entry.label} ({products.filter((p) => p.brand === entry.brand).length})
                </button>
              ))}
            </div>
            <div className="relative ml-auto w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {formOpen && (
          <div
            className="fixed inset-0 z-[95] bg-[rgba(17,24,20,0.5)] backdrop-blur-sm px-4 py-6 sm:px-6 sm:py-10 overflow-y-auto"
            onClick={closeForm}
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? 'Edit product' : 'New product'}
            data-lenis-prevent
          >
          <form
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
            className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--color-card-border)] bg-white p-5 sm:p-6 shadow-[0_24px_60px_rgba(8,14,10,0.28)] space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <Typography variant="h4" className="text-foreground">
                {editingId ? 'Edit Product' : 'New Product'}
              </Typography>
              <button type="button" onClick={closeForm} aria-label="Cancel" className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {!editingId && (
              <Input
                id="product-id"
                label="Product ID (slug — leave blank to generate from name)"
                type="text"
                placeholder="e.g. golden-glow-face-wash"
                value={form.id}
                onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))}
                hint="Can't be changed after creation — used to link orders, wishlists, and the bundled product image."
              />
            )}

            {editingId && (
              <Input label="Product ID" type="text" value={editingId} disabled />
            )}

            <div>
              <label htmlFor="product-brand" className="mb-1.5 block text-[0.78rem] font-semibold text-foreground">
                Storefront
              </label>
              <select
                id="product-brand"
                value={form.brand}
                onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
                className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white px-3 py-2 text-[0.86rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {BRANDS.map((entry) => (
                  <option key={entry.brand} value={entry.brand}>{entry.label}</option>
                ))}
              </select>
              <p className="mt-1 text-[0.74rem] text-muted-foreground">Which shop this product appears in — each brand has its own storefront and cart.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="product-name"
                label="Name"
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <div>
                <Input
                  id="product-category"
                  label="Category"
                  type="text"
                  list="known-categories"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                />
                <datalist id="known-categories">
                  {KNOWN_CATEGORIES.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              <Input
                id="product-size"
                label="Size"
                type="text"
                placeholder="e.g. 100ml"
                value={form.size}
                onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
              />
              <Input
                id="product-price"
                label="Price (LKR)"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              />
              <Input
                id="product-compare-at-price"
                label="Compare-at Price (optional)"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. original price before a sale"
                value={form.compareAtPrice}
                onChange={(event) => setForm((prev) => ({ ...prev, compareAtPrice: event.target.value }))}
                hint="Set this higher than Price to show a SALE badge and a struck-through original price on the storefront. Leave blank for no sale."
              />
              <Input
                id="product-discount-percent"
                label="Discount % (optional helper)"
                type="number"
                min="1"
                max="99"
                step="1"
                placeholder="e.g. 20"
                value={form.discountPercent}
                onChange={(event) => setForm((prev) => ({ ...prev, discountPercent: event.target.value }))}
                hint="Type a percentage off and Compare-at Price above fills in automatically. Just a shortcut — edit Compare-at Price directly if you prefer."
              />
              <Input
                id="product-moq"
                label="Wholesale MOQ (optional)"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 25"
                value={form.moq}
                onChange={(event) => setForm((prev) => ({ ...prev, moq: event.target.value }))}
                hint="Minimum quantity a Corporate Partner must order to unlock wholesale pricing on this product. Leave blank to use the site-wide default (25 units)."
              />
            </div>

            <Input
              id="product-image-url"
              label="Image URL (optional)"
              type="text"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              hint={
                PRODUCT_IMAGES[editingId]
                  ? 'This product has a bundled local image, which takes priority over this URL.'
                  : "There's no bundled local image for this product yet — this URL is what the storefront will show until one is added to the codebase."
              }
            />

            <Textarea
              id="product-description"
              label="Description"
              rows={2}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <Textarea
              id="product-ingredients"
              label="Ingredients"
              rows={2}
              value={form.ingredients}
              onChange={(event) => setForm((prev) => ({ ...prev, ingredients: event.target.value }))}
            />
            <Textarea
              id="product-benefits"
              label="Benefits"
              rows={2}
              value={form.benefits}
              onChange={(event) => setForm((prev) => ({ ...prev, benefits: event.target.value }))}
            />

            {formError && <p className="text-[0.82rem] text-red-600">{formError}</p>}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-[0.84rem] text-foreground">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                Active (visible in the storefront)
              </label>

              <Button type="submit" className="px-5 py-2.5 text-[0.74rem] shrink-0" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
              </Button>
            </div>
          </form>
          </div>
        )}

        {deleteError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.82rem] text-red-700">
            {deleteError}
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {error}
          </div>
        ) : isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground">
            No products match this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const image = PRODUCT_IMAGES[product.id] || product.image_url || null;
              const isPendingDelete = pendingDeleteId === product.id;
              const isDeleting = deletingId === product.id;
              return (
                <div
                  key={product.id}
                  className={`rounded-2xl border bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden flex flex-col ${product.is_active ? 'border-[var(--color-card-border)]' : 'border-gray-300 opacity-70'}`}
                >
                  <div className="aspect-[4/3] bg-[rgba(255,251,243,0.9)] overflow-hidden flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={product.name} className="h-full w-full object-cover object-center" loading="lazy" />
                    ) : (
                      <ImageOff size={24} className="text-text-tertiary" />
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[0.66rem] font-bold tracking-[0.14em] uppercase text-accent">{product.category}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.06em] ${product.is_active ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-gray-300 bg-gray-100 text-gray-600'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="mb-1.5 inline-flex w-fit rounded-full border border-[var(--color-border-light)] bg-white/70 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-text-secondary">
                      {BRAND_BY_VALUE[product.brand]?.label || product.brand}
                    </span>
                    <Typography variant="h4" className="text-foreground text-[0.92rem] mb-1 leading-snug">{product.name}</Typography>
                    <p className="text-[0.76rem] text-muted-foreground mb-2">{product.size}</p>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display text-[1.1rem] text-primary">{formatCurrency(product.price)}</p>
                      {product.compare_at_price && (
                        <p className="text-[0.8rem] text-text-tertiary line-through">{formatCurrency(product.compare_at_price)}</p>
                      )}
                    </div>
                    <p className="text-[0.72rem] text-muted-foreground mb-3">
                      Wholesale MOQ: {product.moq ? `${product.moq} units` : 'default (25 units)'}
                    </p>

                    {isPendingDelete ? (
                      <div className="mt-auto flex items-center gap-2">
                        <span className="flex-1 text-[0.72rem] text-red-600 font-semibold">Delete permanently?</span>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(product)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-[0.72rem] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setPendingDeleteId(null)}
                          className="text-[0.72rem] font-semibold text-text-secondary hover:text-foreground transition-colors disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border-medium)] px-3 py-2 text-[0.72rem] font-semibold text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-[0.72rem] font-semibold transition-colors ${product.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                        >
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(product.id)}
                          aria-label={`Delete ${product.name}`}
                          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border-medium)] px-2.5 py-2 text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
