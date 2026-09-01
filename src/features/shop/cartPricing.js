// Pure cart pricing math, pulled out of Shop.jsx so it can be unit
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

// Sum of each line's effective total.
export function computeEffectiveSubtotal(effectiveCartItems) {
  return effectiveCartItems.reduce((sum, item) => sum + item.effectiveLineTotal, 0);
}

// Subtotal plus shipping.
export function computeEffectiveGrandTotal(effectiveSubtotal, shippingCost) {
  return effectiveSubtotal + shippingCost;
}
