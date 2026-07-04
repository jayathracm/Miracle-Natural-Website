import { supabase } from './supabaseClient';

/** Fetches the signed-in user's saved addresses, default first. */
export async function fetchAddresses() {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createAddress({ label, deliveryZone, addressText }) {
  const { data, error } = await supabase
    .from('addresses')
    .insert({
      label: label.trim() || 'Address',
      delivery_zone: deliveryZone,
      address_text: addressText.trim(),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAddress(id, { label, deliveryZone, addressText }) {
  const { data, error } = await supabase
    .from('addresses')
    .update({
      label: label.trim() || 'Address',
      delivery_zone: deliveryZone,
      address_text: addressText.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAddress(id) {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) {
    throw error;
  }
}

/** Atomically makes `id` the default address, unsetting any previous one. */
export async function setDefaultAddress(id) {
  const { error } = await supabase.rpc('set_default_address', { target_address_id: id });
  if (error) {
    throw error;
  }
}
