import { supabase } from './supabaseClient';

/**
 * Admin-only (RLS gates all of `product_inventory` to admins). Returns one
 * row per product+pool, joined with the product's name/category/active
 * status via the real FK so the admin screen doesn't need a second round
 * trip. The UI groups these by `productId` to show retail/wholesale side by
 * side per product.
 */
export async function fetchProductInventory() {
  const { data, error } = await supabase
    .from('product_inventory')
    .select('product_id, pool, stock_count, low_stock_threshold, updated_at, products(name, category, is_active, brand)')
    .order('product_id', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    productId: row.product_id,
    pool: row.pool,
    stockCount: Number(row.stock_count),
    lowStockThreshold: Number(row.low_stock_threshold),
    updatedAt: row.updated_at,
    productName: row.products?.name || row.product_id,
    productCategory: row.products?.category || null,
    productBrand: row.products?.brand || 'miracle_natural',
    isActive: row.products?.is_active ?? true,
  }));
}

/** `productId` + `pool` together are the primary key — rows are never renamed, only adjusted. */
export async function updateProductStock(productId, pool, { stockCount, lowStockThreshold }) {
  const { data, error } = await supabase
    .from('product_inventory')
    .update({
      stock_count: stockCount,
      low_stock_threshold: lowStockThreshold,
      updated_at: new Date().toISOString(),
    })
    .eq('product_id', productId)
    .eq('pool', pool)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return {
    productId: data.product_id,
    pool: data.pool,
    stockCount: Number(data.stock_count),
    lowStockThreshold: Number(data.low_stock_threshold),
    updatedAt: data.updated_at,
  };
}

/**
 * Raw materials are a separate, simpler inventory track for manufacturing
 * ingredients — never shown to the storefront, admin-managed only. Nothing
 * decrements these automatically (that would need a bill-of-materials
 * linking table to products, out of scope for now); stock is adjusted by
 * hand from the admin screen after a restock/production run.
 */
export async function fetchRawMaterials() {
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((material) => ({
    ...material,
    stock_count: Number(material.stock_count),
    low_stock_threshold: Number(material.low_stock_threshold),
  }));
}

/** `id` is a slug the caller chooses, same convention as `products.id`. */
export async function createRawMaterial({ id, name, unit, stockCount, lowStockThreshold, notes }) {
  const { data, error } = await supabase
    .from('raw_materials')
    .insert({
      id,
      name,
      unit: unit || 'units',
      stock_count: stockCount ?? 0,
      low_stock_threshold: lowStockThreshold ?? 0,
      notes: notes || null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return { ...data, stock_count: Number(data.stock_count), low_stock_threshold: Number(data.low_stock_threshold) };
}

export async function updateRawMaterial(id, { name, unit, stockCount, lowStockThreshold, notes }) {
  const { data, error } = await supabase
    .from('raw_materials')
    .update({
      name,
      unit,
      stock_count: stockCount,
      low_stock_threshold: lowStockThreshold,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return { ...data, stock_count: Number(data.stock_count), low_stock_threshold: Number(data.low_stock_threshold) };
}

/** Safe to hard-delete: nothing references raw_materials by foreign key. */
export async function deleteRawMaterial(id) {
  const { error } = await supabase.from('raw_materials').delete().eq('id', id);
  if (error) {
    throw error;
  }
}

/**
 * Best-effort, non-blocking: call right after a checkout's order+order_items
 * insert succeeds, same pattern as the order-notification email — a failure
 * here should never surface as a failed order to the customer. Idempotent
 * server-side (`orders.inventory_adjusted`), so a caught/retried failure can
 * never double-decrement — see `decrement_inventory_for_order()` in
 * schema.sql.
 */
export async function decrementInventoryForOrder(orderId) {
  const { error } = await supabase.rpc('decrement_inventory_for_order', { p_order_id: orderId });
  if (error) {
    throw error;
  }
}
