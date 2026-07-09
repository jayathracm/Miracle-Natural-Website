import { supabase } from './supabaseClient';

/**
 * Fetches active products from the Supabase `products` table.
 * Numeric columns come back over PostgREST as strings for precision safety,
 * so `price` is coerced back to a JS number here.
 */
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, size, price, compare_at_price, image_url, description, ingredients, benefits')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((product) => ({
    ...product,
    price: Number(product.price),
    compare_at_price: product.compare_at_price === null ? null : Number(product.compare_at_price),
  }));
}

/**
 * Admin-only in practice: the "Admins can view all products" RLS policy
 * means an admin's session sees inactive products too, not just active ones
 * like fetchProducts() above.
 */
export async function fetchAllProductsForAdmin() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((product) => ({
    ...product,
    price: Number(product.price),
    compare_at_price: product.compare_at_price === null ? null : Number(product.compare_at_price),
    moq: product.moq === null || product.moq === undefined ? null : Number(product.moq),
  }));
}

/**
 * `id` is a text slug the caller chooses (not auto-generated) — it's the
 * same key used for order_items.product_id, wishlist_items.product_id, and
 * the local src/data/productImages.js map, so it can't be changed later
 * without breaking those references.
 */
export async function createProduct(payload) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      id: payload.id,
      name: payload.name,
      category: payload.category,
      size: payload.size || null,
      price: payload.price,
      compare_at_price: payload.compareAtPrice ?? null,
      moq: payload.moq ?? null,
      image_url: payload.imageUrl || null,
      description: payload.description || null,
      ingredients: payload.ingredients || null,
      benefits: payload.benefits || null,
      is_active: payload.isActive,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    price: Number(data.price),
    compare_at_price: data.compare_at_price === null ? null : Number(data.compare_at_price),
    moq: data.moq === null || data.moq === undefined ? null : Number(data.moq),
  };
}

/** `id` is intentionally not editable here — see createProduct's note. */
export async function updateProduct(id, payload) {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: payload.name,
      category: payload.category,
      size: payload.size || null,
      price: payload.price,
      compare_at_price: payload.compareAtPrice ?? null,
      moq: payload.moq ?? null,
      image_url: payload.imageUrl || null,
      description: payload.description || null,
      ingredients: payload.ingredients || null,
      benefits: payload.benefits || null,
      is_active: payload.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    price: Number(data.price),
    compare_at_price: data.compare_at_price === null ? null : Number(data.compare_at_price),
    moq: data.moq === null || data.moq === undefined ? null : Number(data.moq),
  };
}
