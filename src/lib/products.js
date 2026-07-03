import { supabase } from './supabaseClient';

/**
 * Fetches active products from the Supabase `products` table.
 * Numeric columns come back over PostgREST as strings for precision safety,
 * so `price` is coerced back to a JS number here.
 */
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, size, price, image_url, description, ingredients, benefits')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((product) => ({
    ...product,
    price: Number(product.price),
  }));
}
