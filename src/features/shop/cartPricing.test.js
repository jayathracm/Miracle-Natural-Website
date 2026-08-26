import { describe, it, expect } from 'vitest';
import {
  computeEffectiveCartItems,
  computeMoqViolations,
  computeBundleSavings,
  computeEffectiveSubtotal,
  computeEffectiveGrandTotal,
} from './cartPricing';

describe('computeEffectiveCartItems', () => {
  const item = { id: 'p1', price: 100, lineTotal: 200, quantity: 2 };

  it('uses retail pricing when not wholesale-eligible, even if a discount is loaded', () => {
    const wholesalePricing = { p1: { unitPrice: 80, lineTotal: 160, meetsMoq: true, appliedDiscountPercent: 20 } };
    const [result] = computeEffectiveCartItems([item], wholesalePricing, false);
    expect(result.effectiveUnitPrice).toBe(100);
    expect(result.effectiveLineTotal).toBe(200);
    expect(result.wholesaleDiscountPercent).toBe(0);
  });

  it('uses retail pricing when eligible but pricing has not loaded yet', () => {
    const [result] = computeEffectiveCartItems([item], {}, true);
    expect(result.effectiveUnitPrice).toBe(100);
    expect(result.wholesaleDiscountPercent).toBe(0);
  });

  it('uses retail pricing when eligible and loaded but under MOQ', () => {
    const wholesalePricing = { p1: { unitPrice: 80, lineTotal: 160, meetsMoq: false, appliedDiscountPercent: 20 } };
    const [result] = computeEffectiveCartItems([item], wholesalePricing, true);
    expect(result.effectiveUnitPrice).toBe(100);
  });

  it('uses retail pricing when eligible, MOQ met, but the discount tier is 0%', () => {
    const wholesalePricing = { p1: { unitPrice: 100, lineTotal: 200, meetsMoq: true, appliedDiscountPercent: 0 } };
    const [result] = computeEffectiveCartItems([item], wholesalePricing, true);
    expect(result.effectiveUnitPrice).toBe(100);
    expect(result.wholesaleDiscountPercent).toBe(0);
  });

  it('applies wholesale pricing when eligible, MOQ met, and a real discount applies', () => {
    const wholesalePricing = { p1: { unitPrice: 80, lineTotal: 160, meetsMoq: true, appliedDiscountPercent: 20 } };
    const [result] = computeEffectiveCartItems([item], wholesalePricing, true);
    expect(result.effectiveUnitPrice).toBe(80);
    expect(result.effectiveLineTotal).toBe(160);
    expect(result.wholesaleDiscountPercent).toBe(20);
  });

  it('preserves original item fields alongside the new effective fields', () => {
    const [result] = computeEffectiveCartItems([item], {}, false);
    expect(result.id).toBe('p1');
    expect(result.quantity).toBe(2);
  });
});

describe('computeMoqViolations', () => {
  const cartItems = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];

  it('returns nothing for non-wholesale-eligible carts, regardless of pricing', () => {
    const wholesalePricing = { p1: { meetsMoq: false } };
    expect(computeMoqViolations(cartItems, wholesalePricing, false)).toEqual([]);
  });

  it('ignores lines whose pricing has not loaded yet, rather than flagging a false violation', () => {
    const wholesalePricing = { p1: { meetsMoq: false } }; // p2, p3 not loaded
    const violations = computeMoqViolations(cartItems, wholesalePricing, true);
    expect(violations).toHaveLength(1);
    expect(violations[0].item.id).toBe('p1');
  });

  it('flags every loaded line that fails MOQ, and only those', () => {
    const wholesalePricing = {
      p1: { meetsMoq: false },
      p2: { meetsMoq: true },
      p3: { meetsMoq: false },
    };
    const violations = computeMoqViolations(cartItems, wholesalePricing, true);
    expect(violations.map((v) => v.item.id)).toEqual(['p1', 'p3']);
  });

  it('returns nothing when every loaded line meets MOQ', () => {
    const wholesalePricing = { p1: { meetsMoq: true }, p2: { meetsMoq: true }, p3: { meetsMoq: true } };
    expect(computeMoqViolations(cartItems, wholesalePricing, true)).toEqual([]);
  });
});

describe('computeBundleSavings', () => {
  const bundle = (overrides) => ({
    id: 'b1',
    name: 'Starter Set',
    price: 150,
    items: [
      { product: { id: 'p1', price: 100 }, quantity: 1 },
      { product: { id: 'p2', price: 80 }, quantity: 1 },
    ],
    ...overrides,
  });

  it('returns no savings for wholesale-eligible carts (bundles never stack with tier pricing)', () => {
    const cartItems = [{ id: 'p1', quantity: 1 }, { id: 'p2', quantity: 1 }];
    expect(computeBundleSavings([bundle()], cartItems, true)).toEqual({ matches: [], discount: 0 });
  });

  it('returns no savings when there are no active bundles or an empty cart', () => {
    expect(computeBundleSavings([], [{ id: 'p1', quantity: 1 }], false)).toEqual({ matches: [], discount: 0 });
    expect(computeBundleSavings([bundle()], [], false)).toEqual({ matches: [], discount: 0 });
  });

  it('returns no savings when the cart does not fully cover the bundle', () => {
    // Only p1, missing p2 entirely.
    const cartItems = [{ id: 'p1', quantity: 1 }];
    expect(computeBundleSavings([bundle()], cartItems, false)).toEqual({ matches: [], discount: 0 });
  });

  it('matches a bundle exactly once and computes the correct savings', () => {
    // individualTotal = 100 + 80 = 180, bundle price = 150 -> savings 30
    const cartItems = [{ id: 'p1', quantity: 1 }, { id: 'p2', quantity: 1 }];
    const result = computeBundleSavings([bundle()], cartItems, false);
    expect(result.discount).toBe(30);
    expect(result.matches).toEqual([{ bundleId: 'b1', bundleName: 'Starter Set', count: 1, savings: 30 }]);
  });

  it('matches a bundle multiple times when the cart has enough stock for repeats', () => {
    // 3x p1, 2x p2 -> min(floor(3/1), floor(2/1)) = 2 matches
    const cartItems = [{ id: 'p1', quantity: 3 }, { id: 'p2', quantity: 2 }];
    const result = computeBundleSavings([bundle()], cartItems, false);
    expect(result.matches[0].count).toBe(2);
    expect(result.discount).toBe(60); // 30 savings per match x 2
  });

  it('greedily prefers the more valuable bundle first so overlapping bundles do not double-claim units', () => {
    // Bundle A: p1 + p2, individualTotal 180, price 150 -> savings 30/match
    // Bundle B: p1 alone, individualTotal 100, price 60 -> savings 40/match, but only needs p1
    // Cart has exactly 1x p1, 1x p2. Bundle B's per-unit savings (40) beats Bundle A's (30),
    // so B should be matched first and consume the only p1, leaving A unmatched.
    const bundleA = bundle();
    const bundleB = {
      id: 'b2',
      name: 'Single Cinnamon Bar',
      price: 60,
      items: [{ product: { id: 'p1', price: 100 }, quantity: 1 }],
    };
    const cartItems = [{ id: 'p1', quantity: 1 }, { id: 'p2', quantity: 1 }];
    const result = computeBundleSavings([bundleA, bundleB], cartItems, false);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].bundleId).toBe('b2');
    expect(result.discount).toBe(40);
  });

  it('ignores bundles with no items or a non-positive individual total', () => {
    const emptyBundle = bundle({ id: 'b-empty', items: [] });
    const freeBundle = bundle({ id: 'b-free', items: [{ product: { id: 'p1', price: 0 }, quantity: 1 }] });
    const cartItems = [{ id: 'p1', quantity: 5 }, { id: 'p2', quantity: 5 }];
    const result = computeBundleSavings([emptyBundle, freeBundle], cartItems, false);
    expect(result).toEqual({ matches: [], discount: 0 });
  });
});

describe('computeEffectiveSubtotal', () => {
  it('sums effective line totals and subtracts the bundle discount', () => {
    const effectiveCartItems = [{ effectiveLineTotal: 200 }, { effectiveLineTotal: 80 }];
    expect(computeEffectiveSubtotal(effectiveCartItems, { discount: 30 })).toBe(250);
  });

  it('handles zero discount and an empty cart', () => {
    expect(computeEffectiveSubtotal([], { discount: 0 })).toBe(0);
  });
});

describe('computeEffectiveGrandTotal', () => {
  it('adds shipping to the subtotal', () => {
    expect(computeEffectiveGrandTotal(250, 350)).toBe(600);
  });

  it('handles zero shipping (e.g. before a delivery zone is selected)', () => {
    expect(computeEffectiveGrandTotal(250, 0)).toBe(250);
  });
});
