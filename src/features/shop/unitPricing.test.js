import { describe, it, expect } from 'vitest';
import { computeUnitPrice } from './unitPricing';

describe('computeUnitPrice', () => {
  it('computes LKR per 100ml for a ml size', () => {
    expect(computeUnitPrice('50ml', 1200)).toEqual({ pricePer100: 2400, unitLabel: '100ml' });
  });

  it('computes LKR per 100g for a g size', () => {
    expect(computeUnitPrice('70g', 350)).toEqual({ pricePer100: 500, unitLabel: '100g' });
  });

  it('normalizes liters to the ml scale', () => {
    expect(computeUnitPrice('1L', 2000)).toEqual({ pricePer100: 200, unitLabel: '100ml' });
  });

  it('normalizes kg to the g scale', () => {
    expect(computeUnitPrice('2kg', 4000)).toEqual({ pricePer100: 200, unitLabel: '100g' });
  });

  it('is case-insensitive and tolerates whitespace', () => {
    expect(computeUnitPrice(' 100 ML ', 500)).toEqual({ pricePer100: 500, unitLabel: '100ml' });
  });

  it('returns null for an unrecognized/free-text size', () => {
    expect(computeUnitPrice('Travel Size', 500)).toBeNull();
    expect(computeUnitPrice('1 pair', 500)).toBeNull();
  });

  it('returns null when size is missing', () => {
    expect(computeUnitPrice(null, 500)).toBeNull();
    expect(computeUnitPrice('', 500)).toBeNull();
  });

  it('returns null for a non-positive or non-finite price', () => {
    expect(computeUnitPrice('100ml', 0)).toBeNull();
    expect(computeUnitPrice('100ml', -5)).toBeNull();
    expect(computeUnitPrice('100ml', NaN)).toBeNull();
  });
});
