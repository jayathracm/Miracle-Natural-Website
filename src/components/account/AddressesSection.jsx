import React, { useEffect, useState } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import DELIVERY_ZONES from '../../data/deliveryZones';
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from '../../lib/addresses';

const inputClasses = "w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClasses = "mb-1.5 block text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary";

const emptyForm = { label: 'Home', deliveryZone: '', addressText: '' };

const AddressesSection = () => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadAddresses = () => {
    setIsLoading(true);
    return fetchAddresses()
      .then(setAddresses)
      .catch((fetchError) => setError(fetchError.message || 'Could not load your addresses.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (address) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      deliveryZone: address.delivery_zone,
      addressText: address.address_text,
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

    if (!form.deliveryZone) {
      setFormError('Please select a delivery zone.');
      return;
    }
    if (!form.addressText.trim()) {
      setFormError('Please enter the address.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateAddress(editingId, form);
      } else {
        await createAddress(form);
      }
      closeForm();
      await loadAddresses();
    } catch {
      setFormError('Could not save this address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteAddress(id);
      await loadAddresses();
    } finally {
      setBusyId(null);
    }
  };

  const handleSetDefault = async (id) => {
    setBusyId(id);
    try {
      await setDefaultAddress(id);
      await loadAddresses();
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.9rem] text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Typography variant="h4" className="text-foreground">Saved Addresses</Typography>
        {!formOpen && (
          <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" icon={Plus} onClick={openAddForm}>
            Add Address
          </Button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 shadow-[0_10px_24px_rgba(31,44,35,0.06)] space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <Typography variant="h4" className="text-foreground text-[1rem]">
              {editingId ? 'Edit Address' : 'New Address'}
            </Typography>
            <button type="button" onClick={closeForm} aria-label="Cancel" className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className={labelClasses} htmlFor="address-label">Label</label>
            <input
              id="address-label"
              type="text"
              placeholder="Home, Work, ..."
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="address-zone">Delivery Zone</label>
            <select
              id="address-zone"
              value={form.deliveryZone}
              onChange={(event) => setForm((prev) => ({ ...prev, deliveryZone: event.target.value }))}
              className={inputClasses}
            >
              <option value="">Select Delivery Zone</option>
              {Object.entries(DELIVERY_ZONES).map(([value, zone]) => (
                <option key={value} value={value}>{zone.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses} htmlFor="address-text">Address</label>
            <textarea
              id="address-text"
              rows={3}
              value={form.addressText}
              onChange={(event) => setForm((prev) => ({ ...prev, addressText: event.target.value }))}
              className={`${inputClasses} resize-none`}
            />
          </div>

          {formError && <p className="text-[0.82rem] text-red-600">{formError}</p>}

          <Button type="submit" className="px-5 py-2.5 text-[0.74rem]" disabled={isSaving}>
            {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Address'}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-12 text-center text-[0.9rem] text-muted-foreground">
          Loading your addresses...
        </div>
      ) : addresses.length === 0 && !formOpen ? (
        <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
          <MapPin size={26} className="text-text-tertiary" />
          <Typography variant="small">No saved addresses yet.</Typography>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-4 sm:p-5 shadow-[0_10px_24px_rgba(31,44,35,0.06)] flex flex-wrap items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[0.9rem] font-semibold text-foreground">{address.label}</p>
                  {address.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.06em] text-primary">
                      <Star size={10} /> Default
                    </span>
                  )}
                </div>
                <p className="text-[0.84rem] text-foreground">{address.address_text}</p>
                <p className="text-[0.76rem] text-muted-foreground mt-0.5">
                  {DELIVERY_ZONES[address.delivery_zone]?.label || address.delivery_zone}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    disabled={busyId === address.id}
                    className="rounded-lg border border-[var(--color-border-medium)] px-2.5 py-1.5 text-[0.72rem] font-semibold text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditForm(address)}
                  aria-label={`Edit ${address.label}`}
                  className="h-8 w-8 rounded-lg border border-[var(--color-border-medium)] inline-flex items-center justify-center text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  disabled={busyId === address.id}
                  aria-label={`Delete ${address.label}`}
                  className="h-8 w-8 rounded-lg border border-[var(--color-border-medium)] inline-flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesSection;
