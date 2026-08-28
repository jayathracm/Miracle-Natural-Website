import { describe, it, expect } from 'vitest';
import { SHOP_CATEGORY_ORDER, SHOP_CATEGORY_MAP, getShopCategory } from './shopCategories';

describe('getShopCategory', () => {
  it('maps a category that is already a shop category to itself', () => {
    expect(getShopCategory({ category: 'Face Care' })).toBe('Face Care');
    expect(getShopCategory({ category: 'Body Care' })).toBe('Body Care');
    expect(getShopCategory({ category: 'Hair Care' })).toBe('Hair Care');
    expect(getShopCategory({ category: 'Lip Care' })).toBe('Lip Care');
  });

  it('folds "Treatment" and "Weekly Care" into "Face Care"', () => {
    expect(getShopCategory({ category: 'Treatment' })).toBe('Face Care');
    expect(getShopCategory({ category: 'Weekly Care' })).toBe('Face Care');
  });

  it('falls back to the raw category when it is not in the map, rather than dropping it', () => {
    expect(getShopCategory({ category: 'Some New Category' })).toBe('Some New Category');
  });

  it('falls back to the raw (falsy) category for missing/empty category, rather than throwing', () => {
    expect(getShopCategory({ category: '' })).toBe('');
    expect(getShopCategory({ category: undefined })).toBe(undefined);
  });

  it('every entry in SHOP_CATEGORY_ORDER is a stable fixed point of the map (maps to itself)', () => {
    SHOP_CATEGORY_ORDER.forEach((category) => {
      expect(getShopCategory({ category })).toBe(category);
    });
  });

  it('every value in SHOP_CATEGORY_MAP is one of the four shop categories', () => {
    Object.values(SHOP_CATEGORY_MAP).forEach((mappedCategory) => {
      expect(SHOP_CATEGORY_ORDER).toContain(mappedCategory);
    });
  });
});
