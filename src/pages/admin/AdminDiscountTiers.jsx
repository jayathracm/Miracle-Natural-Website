import React, { useEffect, useState } from 'react';
import { Pencil, Percent, Plus, RefreshCw, X } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RowSkeletonList } from '../../components/ui/Skeleton';
import {
  createDiscountTier,
  deleteDiscountTier,
  fetchDiscountTiers,
  updateDiscountTier,
} from '../../lib/b2bPricing';

const emptyForm = { minQuantity: '', discountPercent: '', isActive: true };

const AdminDiscountTiers = () => {
  const [tiers, setTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadTiers = () => {
    setIsLoading(true);
    setError(null);
    return fetchDiscountTiers()
      .then(setTiers)
      .catch((fetchError) => setError(fetchError.message || 'Could not load discount tiers.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTiers();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (tier) => {
    setEditingId(tier.id);
    setForm({
      minQuantity: String(tier.min_quantity),
      discountPercent: String(tier.discount_percent),
      isActive: tier.is_active,
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

    const minQuantityNumber = Number(form.minQuantity);
    if (!form.minQuantity || !Number.isInteger(minQuantityNumber) || minQuantityNumber <= 0) {
      setFormError('Minimum quantity must be a whole number greater than 0.');
      return;
    }

    const discountPercentNumber = Number(form.discountPercent);
    if (!form.discountPercent || Number.isNaN(discountPercentNumber) || discountPercentNumber <= 0 || discountPercentNumber > 100) {
      setFormError('Discount percent must be a number between 0 and 100.');
      return;
    }

    const duplicateTier = tiers.find(
      (tier) => tier.min_quantity === minQuantityNumber && tier.id !== editingId
    );
    if (duplicateTier) {
      setFormError(`A tier for ${minQuantityNumber}+ units already exists.`);
      return;
    }

    const payload = {
      minQuantity: minQuantityNumber,
      discountPercent: discountPercentNumber,
      isActive: form.isActive,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateDiscountTier(editingId, payload);
        setTiers((prev) =>
          [...prev.map((tier) => (tier.id === editingId ? updated : tier))].sort(
            (a, b) => a.min_quantity - b.min_quantity
          )
        );
      } else {
        const created = await createDiscountTier(payload);
        setTiers((prev) => [...prev, created].sort((a, b) => a.min_quantity - b.min_quantity));
      }
      closeForm();
    } catch (submitError) {
      if (submitError?.code === '23505') {
        setFormError(`A tier for ${minQuantityNumber}+ units already exists.`);
      } else {
        setFormError('Could not save this tier. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (tier) => {
    try {
      const updated = await updateDiscountTier(tier.id, {
        minQuantity: tier.min_quantity,
        discountPercent: tier.discount_percent,
        isActive: !tier.is_active,
      });
      setTiers((prev) => prev.map((item) => (item.id === tier.id ? updated : item)));
    } catch {
      // Quick toggle, not a form submission — a stale row corrects itself on refresh.
    }
  };

  const handleDelete = async (tier) => {
    setDeleteError(null);
    setDeletingId(tier.id);
    try {
      await deleteDiscountTier(tier.id);
      setTiers((prev) => prev.filter((item) => item.id !== tier.id));
      setPendingDeleteId(null);
    } catch (deleteErrorCaught) {
      setDeleteError(deleteErrorCaught.message || 'Could not delete this tier.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[900px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h2" className="text-foreground text-balance">
              Wholesale Discount Tiers
            </Typography>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" onClick={loadTiers} icon={RefreshCw}>
                Refresh
              </Button>
              {!formOpen && (
                <Button className="px-3 py-2 text-[0.72rem]" onClick={openAddForm} icon={Plus}>
                  Add Tier
                </Button>
              )}
            </div>
          </div>
          <p className="mt-3 text-[0.82rem] text-muted-foreground max-w-prose">
            Applies to Corporate Partner accounts ordering at or above each tier's minimum
            quantity. The highest qualifying tier is used automatically — no stacking. Inactive
            tiers are kept but ignored by the pricing calculation.
          </p>
        </div>

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 shadow-[0_10px_24px_rgba(31,44,35,0.06)] space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <Typography variant="h4" className="text-foreground">
                {editingId ? 'Edit Tier' : 'New Tier'}
              </Typography>
              <button type="button" onClick={closeForm} aria-label="Cancel" className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="tier-min-quantity"
                label="Minimum Quantity"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 50"
                value={form.minQuantity}
                onChange={(event) => setForm((prev) => ({ ...prev, minQuantity: event.target.value }))}
                hint="Order this many units (or more) of a single product to qualify."
              />
              <Input
                id="tier-discount-percent"
                label="Discount Percent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 10"
                value={form.discountPercent}
                onChange={(event) => setForm((prev) => ({ ...prev, discountPercent: event.target.value }))}
              />
            </div>

            <label className="inline-flex items-center gap-2 text-[0.84rem] text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Active (used by the pricing calculation)
            </label>

            {formError && <p className="text-[0.82rem] text-red-600">{formError}</p>}

            <Button type="submit" className="px-5 py-2.5 text-[0.74rem]" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Tier'}
            </Button>
          </form>
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
          <RowSkeletonList count={3} />
        ) : tiers.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Percent size={28} className="text-text-tertiary" />
            <Typography variant="small">No discount tiers yet — add one to get started.</Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {tiers.map((tier) => {
              const isPendingDelete = pendingDeleteId === tier.id;
              const isDeleting = deletingId === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl border bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden px-4 py-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 ${tier.is_active ? 'border-[var(--color-card-border)]' : 'border-gray-300 opacity-70'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[0.86rem] font-semibold text-primary">
                      {tier.min_quantity}+ units
                    </span>
                    <span className="text-[0.9rem] font-semibold text-foreground">
                      {tier.discount_percent}% off
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.06em] ${tier.is_active ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-gray-300 bg-gray-100 text-gray-600'}`}>
                      {tier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPendingDelete ? (
                      <>
                        <span className="text-[0.76rem] text-red-600 font-semibold">Delete this tier?</span>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(tier)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-[0.72rem] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
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
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditForm(tier)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-medium)] px-3 py-1.5 text-[0.72rem] font-semibold text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(tier)}
                          className={`rounded-lg border px-3 py-1.5 text-[0.72rem] font-semibold transition-colors ${tier.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                        >
                          {tier.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(tier.id)}
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

export default AdminDiscountTiers;
