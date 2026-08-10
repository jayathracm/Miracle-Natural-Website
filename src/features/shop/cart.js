import { supabase } from '@/shared/lib/supabaseClient';
import { BRANDS } from '@/shared/lib/brands';

const BRAND_VALUES = BRANDS.map((entry) => entry.brand);
const emptyCartByBrand = () => Object.fromEntries(BRAND_VALUES.map((brand) => [brand, {}]));

/**
 * Loads the signed-in user's saved cart from `cart_items`, shaped the same
 * way CartContext's local state is: { [brand]: { [productId]: quantity } }.
 * RLS scopes rows to the caller automatically (auth.uid() = user_id), so no
 * explicit user filter is needed here — same pattern as wishlist.js.
 */
export async function fetchCart() {
  const { data, error } = await supabase.from('cart_items').select('brand, product_id, quantity');
  if (error) {
    throw error;
  }

  const cartByBrand = emptyCartByBrand();
  (data || []).forEach((row) => {
    if (!cartByBrand[row.brand]) cartByBrand[row.brand] = {};
    cartByBrand[row.brand][row.product_id] = Number(row.quantity);
  });
  return cartByBrand;
}

/**
 * Replaces the signed-in user's saved cart for one brand with `cart` (the
 * full `{ productId: quantity }` map for that brand) — a delete then insert
 * rather than a diffed upsert, since a personal cart is a handful of line
 * items at most and this keeps the client-side logic simple. Not wrapped in
 * a DB transaction, so a failure between the delete and the insert could
 * momentarily leave the saved cart empty for this brand; acceptable here
 * since it self-heals on the next successful sync (CartContext re-syncs on
 * every cart change) and nothing else reads this table synchronously.
 */
export async function syncCartForBrand(brand, cart) {
  const { error: deleteError } = await supabase.from('cart_items').delete().eq('brand', brand);
  if (deleteError) {
    throw deleteError;
  }

  const rows = Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ brand, product_id: productId, quantity }));

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('cart_items').insert(rows);
  if (insertError) {
    throw insertError;
  }
}
