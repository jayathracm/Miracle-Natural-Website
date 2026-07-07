import { supabase } from './supabaseClient';

/**
 * Fetches active bundles with their included products, joined and ordered.
 * `bundle_items` carries `sort_order` so the returned `items` array reflects
 * the intended usage sequence (e.g. cleanser before moisturizer) rather than
 * insertion order.
 */
export async function fetchBundles() {
  const { data, error } = await supabase
    .from('bundles')
    .select(`
      id, name, description, price, points, usage_guide, is_featured,
      bundle_items (
        quantity, sort_order,
        product:products ( id, name, category, size, price, image_url, description, ingredients, benefits )
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((bundle) => ({
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,
    price: Number(bundle.price),
    points: bundle.points || [],
    usageGuide: bundle.usage_guide,
    featured: bundle.is_featured,
    items: (bundle.bundle_items || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .filter((item) => item.product)
      .map((item) => ({
        quantity: item.quantity,
        product: {
          ...item.product,
          price: Number(item.product.price),
        },
      })),
  }));
}
