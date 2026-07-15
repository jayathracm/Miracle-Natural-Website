import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Beaker, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { RowSkeletonList } from '../../components/ui/Skeleton';
import {
  fetchProductInventory,
  updateProductStock,
  fetchRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
} from '../../lib/inventory';

const emptyMaterialForm = { id: '', name: '', unit: 'units', stockCount: '', lowStockThreshold: '', notes: '' };

const slugify = (value) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const isRowLow = (row) => !!row && row.stockCount <= row.lowStockThreshold;

// One editable stock+threshold block for a single pool (retail or wholesale)
// within a product's card. Kept inline (no modal) since this is meant for
// quick "just restocked, bump the number" adjustments.
const PoolEditor = ({ label, row, draft, onDraftChange, onSave, isSaving }) => {
  if (!row || !draft) return null;
  const low = isRowLow(row);

  return (
    <div className={`rounded-xl border px-3 py-2.5 flex-1 min-w-[200px] ${low ? 'border-amber-300 bg-amber-50' : 'border-[var(--color-border-light)] bg-white/70'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-text-secondary">{label}</span>
        {low && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-amber-800">
            <AlertTriangle size={10} />
            Low
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-[0.62rem] text-text-tertiary mb-1">Stock</label>
          <Input
            type="number"
            min="0"
            step="1"
            value={draft.stockCount}
            onChange={(event) => onDraftChange('stockCount', event.target.value)}
            className="py-1.5 text-[0.82rem]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[0.62rem] text-text-tertiary mb-1">Low-stock at</label>
          <Input
            type="number"
            min="0"
            step="1"
            value={draft.lowStockThreshold}
            onChange={(event) => onDraftChange('lowStockThreshold', event.target.value)}
            className="py-1.5 text-[0.82rem]"
          />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-[0.7rem] font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-60 shrink-0"
        >
          {isSaving ? '...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

const AdminInventory = () => {
  // --- Product inventory (retail / wholesale pools) ---
  const [inventory, setInventory] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const seedDrafts = (rows) => {
    const next = {};
    rows.forEach((row) => {
      next[`${row.productId}:${row.pool}`] = {
        stockCount: String(row.stockCount),
        lowStockThreshold: String(row.lowStockThreshold),
      };
    });
    setDrafts(next);
  };

  const loadInventory = () => {
    setIsLoadingInventory(true);
    setInventoryError(null);
    return fetchProductInventory()
      .then((rows) => {
        setInventory(rows);
        seedDrafts(rows);
      })
      .catch((fetchError) => setInventoryError(fetchError.message || 'Could not load inventory.'))
      .finally(() => setIsLoadingInventory(false));
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const groupedProducts = useMemo(() => {
    const map = new Map();
    inventory.forEach((row) => {
      if (!map.has(row.productId)) {
        map.set(row.productId, {
          productId: row.productId,
          productName: row.productName,
          productCategory: row.productCategory,
          isActive: row.isActive,
          retail: null,
          wholesale: null,
        });
      }
      map.get(row.productId)[row.pool] = row;
    });
    return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [inventory]);

  const lowStockCount = useMemo(
    () => groupedProducts.filter((p) => isRowLow(p.retail) || isRowLow(p.wholesale)).length,
    [groupedProducts]
  );

  const filteredProducts = useMemo(() => {
    return groupedProducts.filter((product) => {
      if (searchTerm.trim() && !product.productName.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
        return false;
      }
      if (lowStockOnly && !(isRowLow(product.retail) || isRowLow(product.wholesale))) {
        return false;
      }
      return true;
    });
  }, [groupedProducts, searchTerm, lowStockOnly]);

  const handleDraftChange = (productId, pool, field, value) => {
    const key = `${productId}:${pool}`;
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSaveStock = async (productId, pool) => {
    const key = `${productId}:${pool}`;
    const draft = drafts[key];
    setSaveError(null);

    const stockCount = Number(draft.stockCount);
    const lowStockThreshold = Number(draft.lowStockThreshold);
    if (!Number.isInteger(stockCount) || stockCount < 0) {
      setSaveError('Stock must be a whole number, 0 or more.');
      return;
    }
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      setSaveError('Low-stock threshold must be a whole number, 0 or more.');
      return;
    }

    setSavingKey(key);
    try {
      const updated = await updateProductStock(productId, pool, { stockCount, lowStockThreshold });
      setInventory((prev) =>
        prev.map((row) =>
          row.productId === productId && row.pool === pool
            ? { ...row, stockCount: updated.stockCount, lowStockThreshold: updated.lowStockThreshold, updatedAt: updated.updatedAt }
            : row
        )
      );
    } catch (saveErrorCaught) {
      setSaveError(saveErrorCaught.message || 'Could not save this stock level.');
    } finally {
      setSavingKey(null);
    }
  };

  // --- Raw materials ---
  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [materialsError, setMaterialsError] = useState(null);
  const [materialFormOpen, setMaterialFormOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [materialForm, setMaterialForm] = useState(emptyMaterialForm);
  const [materialFormError, setMaterialFormError] = useState(null);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [pendingDeleteMaterialId, setPendingDeleteMaterialId] = useState(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);
  const [materialDeleteError, setMaterialDeleteError] = useState(null);

  const loadMaterials = () => {
    setIsLoadingMaterials(true);
    setMaterialsError(null);
    return fetchRawMaterials()
      .then(setMaterials)
      .catch((fetchError) => setMaterialsError(fetchError.message || 'Could not load raw materials.'))
      .finally(() => setIsLoadingMaterials(false));
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const openAddMaterialForm = () => {
    setEditingMaterialId(null);
    setMaterialForm(emptyMaterialForm);
    setMaterialFormError(null);
    setMaterialFormOpen(true);
  };

  const openEditMaterialForm = (material) => {
    setEditingMaterialId(material.id);
    setMaterialForm({
      id: material.id,
      name: material.name,
      unit: material.unit,
      stockCount: String(material.stock_count),
      lowStockThreshold: String(material.low_stock_threshold),
      notes: material.notes || '',
    });
    setMaterialFormError(null);
    setMaterialFormOpen(true);
  };

  const closeMaterialForm = () => {
    setMaterialFormOpen(false);
    setEditingMaterialId(null);
    setMaterialForm(emptyMaterialForm);
    setMaterialFormError(null);
  };

  const handleSubmitMaterial = async (event) => {
    event.preventDefault();
    setMaterialFormError(null);

    if (!materialForm.name.trim()) {
      setMaterialFormError('Please enter a name.');
      return;
    }
    const stockCount = Number(materialForm.stockCount);
    if (materialForm.stockCount === '' || Number.isNaN(stockCount) || stockCount < 0) {
      setMaterialFormError('Please enter a valid stock count.');
      return;
    }
    const lowStockThreshold = Number(materialForm.lowStockThreshold);
    if (materialForm.lowStockThreshold === '' || Number.isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      setMaterialFormError('Please enter a valid low-stock threshold.');
      return;
    }

    setIsSavingMaterial(true);
    try {
      if (editingMaterialId) {
        const updated = await updateRawMaterial(editingMaterialId, {
          name: materialForm.name.trim(),
          unit: materialForm.unit.trim() || 'units',
          stockCount,
          lowStockThreshold,
          notes: materialForm.notes.trim(),
        });
        setMaterials((prev) =>
          prev.map((m) => (m.id === editingMaterialId ? updated : m)).sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        const id = slugify(materialForm.id || materialForm.name);
        if (!id) {
          setMaterialFormError('Please enter a valid ID (letters, numbers, hyphens).');
          setIsSavingMaterial(false);
          return;
        }
        const created = await createRawMaterial({
          id,
          name: materialForm.name.trim(),
          unit: materialForm.unit.trim() || 'units',
          stockCount,
          lowStockThreshold,
          notes: materialForm.notes.trim(),
        });
        setMaterials((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      closeMaterialForm();
    } catch (submitError) {
      if (submitError?.code === '23505') {
        setMaterialFormError('A raw material with that ID already exists.');
      } else {
        setMaterialFormError('Could not save this raw material. Please try again.');
      }
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (material) => {
    setMaterialDeleteError(null);
    setDeletingMaterialId(material.id);
    try {
      await deleteRawMaterial(material.id);
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
      setPendingDeleteMaterialId(null);
    } catch (deleteErrorCaught) {
      setMaterialDeleteError(deleteErrorCaught.message || 'Could not delete this raw material.');
    } finally {
      setDeletingMaterialId(null);
    }
  };

  const lowStockMaterialCount = useMemo(
    () => materials.filter((m) => m.stock_count <= m.low_stock_threshold).length,
    [materials]
  );

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h2" className="text-foreground text-balance">
              Inventory Management
            </Typography>
            <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" onClick={() => { loadInventory(); loadMaterials(); }} icon={RefreshCw}>
              Refresh
            </Button>
          </div>
          <p className="mt-3 text-[0.82rem] text-muted-foreground max-w-prose">
            Retail and wholesale stock are tracked separately per product — a retail sale only
            draws from the retail pool, a B2B order only from wholesale. Stock decrements
            automatically as orders come in; adjust it here after a restock. Raw materials
            (manufacturing ingredients) are a separate, manually-tracked pool below.
          </p>
        </div>

        {/* ---------------- Product inventory ---------------- */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-8"
            />
          </div>
          <button
            type="button"
            onClick={() => setLowStockOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.06em] uppercase transition-colors ${lowStockOnly ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
          >
            <AlertTriangle size={13} />
            Low stock only {lowStockCount > 0 ? `(${lowStockCount})` : ''}
          </button>
        </div>

        {saveError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.82rem] text-red-700">
            {saveError}
          </div>
        )}

        {inventoryError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {inventoryError}
          </div>
        ) : isLoadingInventory ? (
          <RowSkeletonList count={4} />
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground">
            No products match this filter.
          </div>
        ) : (
          <div className="space-y-3 mb-10">
            {filteredProducts.map((product) => (
              <div
                key={product.productId}
                className={`rounded-2xl border bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] px-4 py-3.5 sm:px-5 ${product.isActive ? 'border-[var(--color-card-border)]' : 'border-gray-300 opacity-70'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <Typography variant="h4" className="text-foreground text-[0.92rem]">{product.productName}</Typography>
                    <p className="text-[0.7rem] text-muted-foreground">{product.productCategory}</p>
                  </div>
                  {!product.isActive && (
                    <span className="rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <PoolEditor
                    label="Retail"
                    row={product.retail}
                    draft={drafts[`${product.productId}:retail`]}
                    onDraftChange={(field, value) => handleDraftChange(product.productId, 'retail', field, value)}
                    onSave={() => handleSaveStock(product.productId, 'retail')}
                    isSaving={savingKey === `${product.productId}:retail`}
                  />
                  <PoolEditor
                    label="Wholesale"
                    row={product.wholesale}
                    draft={drafts[`${product.productId}:wholesale`]}
                    onDraftChange={(field, value) => handleDraftChange(product.productId, 'wholesale', field, value)}
                    onSave={() => handleSaveStock(product.productId, 'wholesale')}
                    isSaving={savingKey === `${product.productId}:wholesale`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- Raw materials ---------------- */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Beaker size={18} className="text-primary" />
            <Typography variant="h3" className="text-foreground text-[1.15rem]">
              Raw Materials {lowStockMaterialCount > 0 ? `(${lowStockMaterialCount} low)` : ''}
            </Typography>
          </div>
          {!materialFormOpen && (
            <Button className="px-3 py-2 text-[0.72rem]" onClick={openAddMaterialForm} icon={Plus}>
              Add Material
            </Button>
          )}
        </div>

        {materialFormOpen && (
          <form
            onSubmit={handleSubmitMaterial}
            className="mb-6 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 shadow-[0_10px_24px_rgba(31,44,35,0.06)] space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <Typography variant="h4" className="text-foreground">
                {editingMaterialId ? 'Edit Raw Material' : 'New Raw Material'}
              </Typography>
              <button type="button" onClick={closeMaterialForm} aria-label="Cancel" className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {!editingMaterialId && (
              <Input
                id="material-id"
                label="ID (slug — leave blank to generate from name)"
                type="text"
                placeholder="e.g. kojic-acid"
                value={materialForm.id}
                onChange={(event) => setMaterialForm((prev) => ({ ...prev, id: event.target.value }))}
              />
            )}
            {editingMaterialId && <Input label="ID" type="text" value={editingMaterialId} disabled />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="material-name"
                label="Name"
                type="text"
                value={materialForm.name}
                onChange={(event) => setMaterialForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <Input
                id="material-unit"
                label="Unit"
                type="text"
                placeholder="e.g. kg, L, units"
                value={materialForm.unit}
                onChange={(event) => setMaterialForm((prev) => ({ ...prev, unit: event.target.value }))}
              />
              <Input
                id="material-stock"
                label="Stock Count"
                type="number"
                min="0"
                step="0.01"
                value={materialForm.stockCount}
                onChange={(event) => setMaterialForm((prev) => ({ ...prev, stockCount: event.target.value }))}
              />
              <Input
                id="material-threshold"
                label="Low-Stock Threshold"
                type="number"
                min="0"
                step="0.01"
                value={materialForm.lowStockThreshold}
                onChange={(event) => setMaterialForm((prev) => ({ ...prev, lowStockThreshold: event.target.value }))}
              />
            </div>

            <Textarea
              id="material-notes"
              label="Notes (optional)"
              rows={2}
              value={materialForm.notes}
              onChange={(event) => setMaterialForm((prev) => ({ ...prev, notes: event.target.value }))}
            />

            {materialFormError && <p className="text-[0.82rem] text-red-600">{materialFormError}</p>}

            <Button type="submit" className="px-5 py-2.5 text-[0.74rem]" disabled={isSavingMaterial}>
              {isSavingMaterial ? 'Saving...' : editingMaterialId ? 'Save Changes' : 'Add Material'}
            </Button>
          </form>
        )}

        {materialDeleteError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.82rem] text-red-700">
            {materialDeleteError}
          </div>
        )}

        {materialsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {materialsError}
          </div>
        ) : isLoadingMaterials ? (
          <RowSkeletonList count={2} />
        ) : materials.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Beaker size={28} className="text-text-tertiary" />
            <Typography variant="small">No raw materials tracked yet — add one to get started.</Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => {
              const isPendingDelete = pendingDeleteMaterialId === material.id;
              const isDeleting = deletingMaterialId === material.id;
              const low = material.stock_count <= material.low_stock_threshold;

              return (
                <div
                  key={material.id}
                  className={`rounded-2xl border bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden px-4 py-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 ${low ? 'border-amber-300' : 'border-[var(--color-card-border)]'}`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <Typography variant="h4" className="text-foreground text-[0.9rem]">{material.name}</Typography>
                      {material.notes && <p className="text-[0.72rem] text-muted-foreground">{material.notes}</p>}
                    </div>
                    <span className="text-[0.86rem] font-semibold text-foreground">
                      {material.stock_count} {material.unit}
                    </span>
                    {low && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-amber-800">
                        <AlertTriangle size={10} />
                        Low (below {material.low_stock_threshold})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isPendingDelete ? (
                      <>
                        <span className="text-[0.76rem] text-red-600 font-semibold">Delete this material?</span>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteMaterial(material)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-[0.72rem] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setPendingDeleteMaterialId(null)}
                          className="text-[0.72rem] font-semibold text-text-secondary hover:text-foreground transition-colors disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditMaterialForm(material)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-medium)] px-3 py-1.5 text-[0.72rem] font-semibold text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteMaterialId(material.id)}
                          className="rounded-lg border border-[var(--color-border-medium)] px-3 py-1.5 text-[0.72rem] font-semibold text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </>
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

export default AdminInventory;
