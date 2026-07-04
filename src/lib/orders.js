import { supabase } from './supabaseClient';

/**
 * Fetches the signed-in user's own order history, newest first, with each
 * order's line items nested in. RLS ("Users can view their own orders")
 * scopes this to auth.uid() automatically — no explicit filter needed here.
 */
export async function fetchMyOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(id, product_name, quantity, unit_price, line_total)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
