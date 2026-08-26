import { supabase } from '@/shared/lib/supabaseClient';
import { BRANDS } from '@/shared/lib/brands';

const BRAND_VALUES = BRANDS.map((entry) => entry.brand);
const emptyCartByBrand = () => Object.fromEntries(BRAND_VALUES.map((brand) => [brand, {}]));

// Loads the signed-in user's saved cart, shaped like CartContext's local
// state: { [brand]: { [productId]: quantity } }. RLS scopes rows to the
// caller automatically, so no explicit user filter needed.
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

// Replaces the saved cart for one brand with `cart` — delete then insert,
// since a cart is only a few items. Not transactional, but self-heals on
// the next sync if it fails partway through.
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
