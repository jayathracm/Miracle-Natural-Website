import { describe, it, expect } from 'vitest';
import { BRANDS, BRAND_BY_SLUG, BRAND_BY_VALUE, isValidBrandSlug, shopPathForSlug, shopPathForBrand } from './brands';

describe('BRAND_BY_SLUG / BRAND_BY_VALUE', () => {
  it('indexes every brand by its slug', () => {
    BRANDS.forEach((entry) => {
      expect(BRAND_BY_SLUG[entry.slug]).toBe(entry);
    });
  });

  it('indexes every brand by its brand value', () => {
    BRANDS.forEach((entry) => {
      expect(BRAND_BY_VALUE[entry.brand]).toBe(entry);
    });
  });
});

describe('isValidBrandSlug', () => {
  it('returns true for a real brand slug', () => {
    expect(isValidBrandSlug('miracle-natural')).toBe(true);
    expect(isValidBrandSlug('laira')).toBe(true);
  });

  it('returns false for an unrecognized slug', () => {
    expect(isValidBrandSlug('leora-wellness')).toBe(false);
    expect(isValidBrandSlug('')).toBe(false);
    expect(isValidBrandSlug('made-up-brand')).toBe(false);
  });

  it('is case-sensitive (does not treat MIRACLE-NATURAL as valid)', () => {
    expect(isValidBrandSlug('MIRACLE-NATURAL')).toBe(false);
  });
});

describe('shopPathForSlug', () => {
  it('builds the /:slug/shop path for any slug, valid or not', () => {
    expect(shopPathForSlug('miracle-natural')).toBe('/miracle-natural/shop');
    expect(shopPathForSlug('laira')).toBe('/laira/shop');
  });
});

describe('shopPathForBrand', () => {
  it('resolves a known brand value to its shop path', () => {
    expect(shopPathForBrand('miracle_natural')).toBe('/miracle-natural/shop');
    expect(shopPathForBrand('laira')).toBe('/laira/shop');
  });

  it('falls back to the first brand in the list for an unrecognized brand value', () => {
    expect(shopPathForBrand('leora_wellness')).toBe(shopPathForSlug(BRANDS[0].slug));
    expect(shopPathForBrand(undefined)).toBe(shopPathForSlug(BRANDS[0].slug));
  });
});
