import React, { useEffect, useMemo, useState } from 'react';
import { ImageOff, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import PRODUCT_IMAGES from '../../data/productImages';
import { createProduct, fetchAllProductsForAdmin, updateProduct } from '../../lib/products';

// Suggestions only (via <datalist>) — not an enum. Category is a free-text
// column; Shop.jsx groups anything unrecognized under its own name rather
// than breaking, so a brand-new category here is safe, just ungrouped.
const KNOWN_CATEGORIES = ['Face Care', 'Treatment', 'Weekly Care', 'Body Care', 'Hair Care', 'Lip Care'];

const inputClasses = "w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClasses = "mb-1.5 block text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary";

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

const emptyForm = {
  id: '',
  name: '',
  category: '',
  size: '',
  price: '',
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
  const [searchTerm, setSearchTerm] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
      if (searchTerm.trim() && !product.name.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [products, statusFilter, searchTerm]);

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
      name: product.name,
      category: product.category,
      size: product.size || '',
      price: String(product.price),
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

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      size: form.size.trim(),
      price: priceNumber,
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
        name: product.name,
        category: product.category,
        size: product.size,
        price: Number(product.price),
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
            <div className="relative ml-auto w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className={`${inputClasses} pl-8`}
              />
            </div>
          </div>
        </div>

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 shadow-[0_10px_24px_rgba(31,44,35,0.06)] space-y-3.5"
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
              <div>
                <label className={labelClasses} htmlFor="product-id">
                  Product ID (slug — leave blank to generate from name)
                </label>
                <input
                  id="product-id"
                  type="text"
                  placeholder="e.g. golden-glow-face-wash"
                  value={form.id}
                  onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))}
                  className={inputClasses}
                />
                <p className="mt-1 text-[0.72rem] text-muted-foreground">
                  Can't be changed after creation — used to link orders, wishlists, and the bundled product image.
                </p>
              </div>
            )}

            {editingId && (
              <div>
                <label className={labelClasses}>Product ID</label>
                <input type="text" value={editingId} disabled className={`${inputClasses} opacity-60`} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelClasses} htmlFor="product-name">Name</label>
                <input
                  id="product-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="product-category">Category</label>
                <input
                  id="product-category"
                  type="text"
                  list="known-categories"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className={inputClasses}
                />
                <datalist id="known-categories">
                  {KNOWN_CATEGORIES.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelClasses} htmlFor="product-size">Size</label>
                <input
                  id="product-size"
                  type="text"
                  placeholder="e.g. 100ml"
                  value={form.size}
                  onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="product-price">Price (LKR)</label>
                <input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses} htmlFor="product-image-url">
                Image URL (optional)
              </label>
              <input
                id="product-image-url"
                type="text"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                className={inputClasses}
              />
              <p className="mt-1 text-[0.72rem] text-muted-foreground">
                {PRODUCT_IMAGES[editingId]
                  ? 'This product has a bundled local image, which takes priority over this URL.'
                  : "There's no bundled local image for this product yet — this URL is what the storefront will show until one is added to the codebase."}
              </p>
            </div>

            <div>
              <label className={labelClasses} htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                rows={2}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className={`${inputClasses} resize-none`}
              />
            </div>
            <div>
              <label className={labelClasses} htmlFor="product-ingredients">Ingredients</label>
              <textarea
                id="product-ingredients"
                rows={2}
                value={form.ingredients}
                onChange={(event) => setForm((prev) => ({ ...prev, ingredients: event.target.value }))}
                className={`${inputClasses} resize-none`}
              />
            </div>
            <div>
              <label className={labelClasses} htmlFor="product-benefits">Benefits</label>
              <textarea
                id="product-benefits"
                rows={2}
                value={form.benefits}
                onChange={(event) => setForm((prev) => ({ ...prev, benefits: event.target.value }))}
                className={`${inputClasses} resize-none`}
              />
            </div>

            <label className="inline-flex items-center gap-2 text-[0.84rem] text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Active (visible in the storefront)
            </label>

            {formError && <p className="text-[0.82rem] text-red-600">{formError}</p>}

            <Button type="submit" className="px-5 py-2.5 text-[0.74rem]" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
            </Button>
          </form>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {error}
          </div>
        ) : isLoading ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-[0.95rem] text-muted-foreground">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground">
            No products match this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const image = PRODUCT_IMAGES[product.id] || product.image_url || null;
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
                    <Typography variant="h4" className="text-foreground text-[0.92rem] mb-1 leading-snug">{product.name}</Typography>
                    <p className="text-[0.76rem] text-muted-foreground mb-2">{product.size}</p>
                    <p className="font-display text-[1.1rem] text-primary mb-3">{formatCurrency(product.price)}</p>

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
                    </div>
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
