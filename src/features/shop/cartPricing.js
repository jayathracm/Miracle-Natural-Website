// Pure cart/bundle pricing math, pulled out of Shop.jsx so it can be unit
// tested without rendering the whole page. Shop.jsx still owns the
// memoization — only the math moved here.

// Applies wholesale pricing to a line if the account is eligible, meets
// MOQ, and actually gets a discount. Otherwise plain retail price.
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

// Cart lines under a product's MOQ, wholesale accounts only. Skips lines
// whose pricing hasn't loaded yet so we don't flag a false violation.
export function computeMoqViolations(cartItems, wholesalePricing, isWholesaleEligible) {
  if (!isWholesaleEligible) return [];
  return cartItems
    .map((item) => ({ item, pricing: wholesalePricing[item.id] }))
    .filter(({ pricing }) => pricing && !pricing.meetsMoq);
}

// Finds which bundles the cart fully covers and credits the bundle price
// instead of the items' individual prices. Greedy, most-valuable bundle
// first, so overlapping bundles can't double-claim the same units.
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

// Line totals minus bundle savings.
export function computeEffectiveSubtotal(effectiveCartItems, bundleSavings) {
  return effectiveCartItems.reduce((sum, item) => sum + item.effectiveLineTotal, 0) - bundleSavings.discount;
}

// Subtotal plus shipping.
export function computeEffectiveGrandTotal(effectiveSubtotal, shippingCost) {
  return effectiveSubtotal + shippingCost;
}
