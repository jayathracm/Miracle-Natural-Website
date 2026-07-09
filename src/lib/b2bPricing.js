import { supabase } from './supabaseClient';

/**
 * Thin wrapper around the `calculate_b2b_price` Postgres function — the
 * single source of truth for B2B pricing math (base price, MOQ, requested
 * quantity, discount-tier scaling). See functional-requirements.md §2.2.
 *
 * Eligibility (corporate_partner/admin vs. plain customer) and MOQ are
 * enforced server-side inside the function itself, not here — this helper
 * just shapes the RPC call/response for JS callers. A signed-out or
 * `customer`-role caller still gets a valid response back (retail pricing,
 * `isEligible: false`), it's just never discounted, so this is safe to call
 * from anywhere without checking the user's role first.
 *
 * @param {string} productId
 * @param {number} quantity - must be a positive integer.
 * @returns {Promise<{
 *   basePrice: number,
 *   moq: number,
 *   requestedQuantity: number,
 *   isEligible: boolean,
 *   meetsMoq: boolean,
 *   appliedDiscountPercent: number,
 *   unitPrice: number,
 *   lineTotal: number,
 *   nextTierMinQuantity: number | null,
 *   nextTierDiscountPercent: number | null,
 * }>}
 */
export async function calculateB2BPrice(productId, quantity) {
  const { data, error } = await supabase
    .rpc('calculate_b2b_price', { p_product_id: productId, p_quantity: quantity })
    .single();

  if (error) {
    throw error;
  }

  return {
    basePrice: Number(data.base_price),
    moq: Number(data.moq),
    requestedQuantity: Number(data.requested_quantity),
    isEligible: data.is_eligible,
    meetsMoq: data.meets_moq,
    appliedDiscountPercent: Number(data.applied_discount_percent),
    unitPrice: Number(data.unit_price),
    lineTotal: Number(data.line_total),
    nextTierMinQuantity: data.next_tier_min_quantity === null ? null : Number(data.next_tier_min_quantity),
    nextTierDiscountPercent: data.next_tier_discount_percent === null ? null : Number(data.next_tier_discount_percent),
  };
}

/**
 * Admin-only in practice (RLS on `discount_tiers` only allows
 * admin/corporate_partner to select) — fetches the active tier schedule for
 * a future "manage discount tiers" admin screen or a storefront breakpoint
 * display ("order 12 more to unlock 15% off").
 */
export async function fetchDiscountTiers() {
  const { data, error } = await supabase
    .from('discount_tiers')
    .select('id, min_quantity, discount_percent, is_active')
    .order('min_quantity', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((tier) => ({
    ...tier,
    discount_percent: Number(tier.discount_percent),
  }));
}

/** id is omitted — `discount_tiers` rows are created fresh, never renamed. */
export async function createDiscountTier({ minQuantity, discountPercent, isActive = true }) {
  const { data, error } = await supabase
    .from('discount_tiers')
    .insert({ min_quantity: minQuantity, discount_percent: discountPercent, is_active: isActive })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return { ...data, discount_percent: Number(data.discount_percent) };
}

export async function updateDiscountTier(id, { minQuantity, discountPercent, isActive }) {
  const { data, error } = await supabase
    .from('discount_tiers')
    .update({
      min_quantity: minQuantity,
      discount_percent: discountPercent,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return { ...data, discount_percent: Number(data.discount_percent) };
}

/** Safe to hard-delete: nothing references discount_tiers by foreign key. */
export async function deleteDiscountTier(id) {
  const { error } = await supabase.from('discount_tiers').delete().eq('id', id);
  if (error) {
    throw error;
  }
}
