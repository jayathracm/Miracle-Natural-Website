import { supabase } from './supabaseClient';

/**
 * Lightweight fetch of just the product ids the signed-in user has
 * wishlisted — enough to render heart-icon state on the Shop page without
 * pulling full product rows.
 */
export async function fetchWishlistProductIds() {
  const { data, error } = await supabase.from('wishlist_items').select('product_id');
  if (error) {
    throw error;
  }
  return (data || []).map((row) => row.product_id);
}

/**
 * Full wishlist with product details joined in, for the profile page.
 * If a wishlisted product was deactivated, the products embed comes back
 * null (RLS on `products` only exposes is_active = true rows) — callers
 * should filter those out rather than crash on a missing product.
 */
export async function fetchWishlist() {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('id, created_at, product_id, products(id, name, category, size, price, image_url, description)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function addToWishlist(productId) {
  const { error } = await supabase.from('wishlist_items').insert({ product_id: productId });

  // 23505 = unique_violation — already wishlisted, treat as a no-op success
  // rather than an error the caller has to special-case.
  if (error && error.code !== '23505') {
    throw error;
  }
}

export async function removeFromWishlist(productId) {
  const { error } = await supabase.from('wishlist_items').delete().eq('product_id', productId);
  if (error) {
    throw error;
  }
}
