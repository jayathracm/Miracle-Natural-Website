import { describe, it, expect } from 'vitest';
import {
  computeEffectiveCartItems,
  computeMoqViolations,
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

describe('computeEffectiveSubtotal', () => {
  it('sums effective line totals', () => {
    const effectiveCartItems = [{ effectiveLineTotal: 200 }, { effectiveLineTotal: 80 }];
    expect(computeEffectiveSubtotal(effectiveCartItems)).toBe(280);
  });

  it('handles an empty cart', () => {
    expect(computeEffectiveSubtotal([])).toBe(0);
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
