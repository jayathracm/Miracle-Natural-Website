// Pure cart-parsing/merge logic, pulled out of CartContext.jsx so it can be
// unit tested without a browser (no localStorage, no React) in the loop.

// Empty { brand: {} } map for every brand.
export function emptyCartByBrand(brandValues) {
  return Object.fromEntries(brandValues.map((brand) => [brand, {}]));
}

// Turns the raw localStorage string into a cart-by-brand object. Handles a
// missing/invalid value, a pre-brand-split flat cart (treated as the given
// legacy brand instead of being discarded), and the normal shape.
export function parseStoredCart(raw, brandValues, legacyBrand) {
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return emptyCartByBrand(brandValues);
  }

  if (!parsed || typeof parsed !== 'object') {
    return emptyCartByBrand(brandValues);
  }

  const looksLegacy = !brandValues.some((brand) => brand in parsed);
  if (looksLegacy) {
    return { ...emptyCartByBrand(brandValues), [legacyBrand]: parsed };
  }

  const next = emptyCartByBrand(brandValues);
  brandValues.forEach((brand) => {
    if (parsed[brand] && typeof parsed[brand] === 'object') {
      next[brand] = parsed[brand];
    }
  });
  return next;
}

// Merges a just-logged-in guest's local cart into their server cart —
// summed quantities per product, per brand. Used only the first time an
// account is active on a device; a later reload just takes the server cart as-is.
export function mergeCartsOnLogin(serverCartByBrand, prevLocalCartByBrand, brandValues) {
  const merged = emptyCartByBrand(brandValues);
  brandValues.forEach((brand) => {
    merged[brand] = { ...serverCartByBrand[brand] };
    Object.entries(prevLocalCartByBrand[brand] || {}).forEach(([productId, quantity]) => {
      merged[brand][productId] = (merged[brand][productId] || 0) + quantity;
    });
  });
  return merged;
}
