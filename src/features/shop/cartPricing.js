// Pure cart/bundle pricing math, extracted out of Shop.jsx's useMemo blocks
// so it can be unit tested in isolation without rendering the whole Shop
// page (Supabase, routing, auth, and a dozen other dependencies). Shop.jsx
// still owns the memoization (useMemo wrapping calls into these functions)
// — nothing about when this recomputes has changed, only where the actual
// logic lives. See docs/payhere-integration-plan.md-style reasoning: keep
// business logic testable, keep the component a thin caller.

/**
 * Blends server-computed wholesale/tier pricing into each cart line, for
 * wholesale-eligible accounts whose current quantity both meets a product's
 * MOQ and actually earns a discount. Everyone else (not eligible, pricing
 * not loaded yet, under MOQ, or a 0% tier) gets plain retail pricing —
 * exactly what's already shown everywhere else in the app (ProductCard,
 * Ritual Builder, bundle popups), so this is purely a checkout-time
 * adjustment, never a source of a different "real" price.
 *
 * @param {Array<{id: string, price: number, lineTotal: number}>} cartItems
 * @param {Record<string, {unitPrice: number, lineTotal: number, meetsMoq: boolean, appliedDiscountPercent: number}>} wholesalePricing
 * @param {boolean} isWholesaleEligible
 */
export function computeEffectiveCartItems(cartItems, wholesalePricing, isWholesaleEligible) {
  return cartItems.map((item) => {
    const pricing = wholesalePricing[item.id];
    const applies = isWholesaleEligible && pricing && pricing.meetsMoq && pricing.appliedDiscountPercent > 0;
    return {
      ...item,
      effectiveUnitPrice: applies ? pricing.unitPrice : item.price,
      effectiveLineTotal: applies ? pricing.lineTotal : item.lineTotal,
      wholesaleDiscountPercent: applies ? pricing.appliedDiscountPercent : 0,
    };
  });
}

/**
 * Cart lines that fail their product's minimum order quantity, for
 * wholesale-eligible carts only — retail customers are never subject to
 * MOQ. A line only counts once its pricing has actually loaded
 * (wholesalePricing[item.id] is set); treating a still-loading line as a
 * violation would produce a confusing false block.
 *
 * @param {Array<{id: string}>} cartItems
 * @param {Record<string, {meetsMoq: boolean}>} wholesalePricing
 * @param {boolean} isWholesaleEligible
 */
export function computeMoqViolations(cartItems, wholesalePricing, isWholesaleEligible) {
  if (!isWholesaleEligible) return [];
  return cartItems
    .map((item) => ({ item, pricing: wholesalePricing[item.id] }))
    .filter(({ pricing }) => pricing && !pricing.meetsMoq);
}

/**
 * Detects which active bundles the cart's contents fully cover (at retail
 * prices — bundles don't stack with wholesale tier pricing) and credits the
 * bundle's flat price instead of the sum of its items' individual prices.
 * Greedy match, most-valuable bundle first (by absolute savings), so
 * overlapping bundles can't double-claim the same units: a "working"
 * quantity map is decremented as each bundle is matched, and whatever's
 * left over after all bundles are considered is priced normally.
 *
 * @param {Array<{id: string, price: number, items: Array<{product: {id: string, price: number}, quantity: number}>}>} bundles
 * @param {Array<{id: string, quantity: number}>} cartItems
 * @param {boolean} isWholesaleEligible
 * @returns {{matches: Array<{bundleId: string, bundleName: string, count: number, savings: number}>, discount: number}}
 */
export function computeBundleSavings(bundles, cartItems, isWholesaleEligible) {
  const empty = { matches: [], discount: 0 };
  if (isWholesaleEligible || bundles.length === 0 || cartItems.length === 0) return empty;

  const available = {};
  cartItems.forEach((item) => {
    available[item.id] = item.quantity;
  });

  const candidates = bundles
    .filter((bundle) => bundle.items.length > 0)
    .map((bundle) => ({
      bundle,
      individualTotal: bundle.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    }))
    .filter(({ individualTotal }) => individualTotal > 0)
    .sort((a, b) => (b.individualTotal - b.bundle.price) - (a.individualTotal - a.bundle.price));

  const matches = [];
  let discount = 0;

  candidates.forEach(({ bundle, individualTotal }) => {
    const timesAvailable = Math.min(
      ...bundle.items.map((item) => Math.floor((available[item.product.id] || 0) / item.quantity))
    );
    if (timesAvailable > 0) {
      bundle.items.forEach((item) => {
        available[item.product.id] -= item.quantity * timesAvailable;
      });
      const savingsForMatch = (individualTotal - bundle.price) * timesAvailable;
      discount += savingsForMatch;
      matches.push({ bundleId: bundle.id, bundleName: bundle.name, count: timesAvailable, savings: savingsForMatch });
    }
  });

  return { matches, discount };
}

/** Sum of effective line totals, minus whatever bundle matching saved. */
export function computeEffectiveSubtotal(effectiveCartItems, bundleSavings) {
  return effectiveCartItems.reduce((sum, item) => sum + item.effectiveLineTotal, 0) - bundleSavings.discount;
}

/** Subtotal plus shipping — the actual amount charged/displayed at checkout. */
export function computeEffectiveGrandTotal(effectiveSubtotal, shippingCost) {
  return effectiveSubtotal + shippingCost;
}
