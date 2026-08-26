import { describe, it, expect } from 'vitest';
import { emptyCartByBrand, parseStoredCart, mergeCartsOnLogin } from './cartMerge';

const BRANDS = ['miracle_natural', 'laira'];

describe('emptyCartByBrand', () => {
  it('returns an empty object for every brand', () => {
    expect(emptyCartByBrand(BRANDS)).toEqual({ miracle_natural: {}, laira: {} });
  });

  it('returns independent objects per brand, not shared references', () => {
    const result = emptyCartByBrand(BRANDS);
    result.miracle_natural.p1 = 2;
    expect(result.laira).toEqual({});
  });

  it('handles an empty brand list', () => {
    expect(emptyCartByBrand([])).toEqual({});
  });
});

describe('parseStoredCart', () => {
  it('returns an empty cart for null/undefined raw input', () => {
    expect(parseStoredCart(null, BRANDS, 'miracle_natural')).toEqual({ miracle_natural: {}, laira: {} });
    expect(parseStoredCart(undefined, BRANDS, 'miracle_natural')).toEqual({ miracle_natural: {}, laira: {} });
  });

  it('returns an empty cart for invalid JSON, rather than throwing', () => {
    expect(parseStoredCart('{not valid json', BRANDS, 'miracle_natural')).toEqual({ miracle_natural: {}, laira: {} });
  });

  it('returns an empty cart when the parsed value is not an object (e.g. a bare number or string)', () => {
    expect(parseStoredCart('42', BRANDS, 'miracle_natural')).toEqual({ miracle_natural: {}, laira: {} });
    expect(parseStoredCart('"hello"', BRANDS, 'miracle_natural')).toEqual({ miracle_natural: {}, laira: {} });
    expect(parseStoredCart('null', BRANDS, 'miracle_natural')).toEqual({ miracle_natural: {}, laira: {} });
  });

  it('treats a pre-brand-split flat cart as the legacy brand', () => {
    const legacyFlatCart = JSON.stringify({ 'golden-glow-face-wash': 2, 'herbal-shampoo': 1 });
    const result = parseStoredCart(legacyFlatCart, BRANDS, 'miracle_natural');
    expect(result).toEqual({
      miracle_natural: { 'golden-glow-face-wash': 2, 'herbal-shampoo': 1 },
      laira: {},
    });
  });

  it('parses a normal, already-brand-partitioned cart as-is', () => {
    const raw = JSON.stringify({ miracle_natural: { p1: 2 }, laira: { p2: 1 } });
    expect(parseStoredCart(raw, BRANDS, 'miracle_natural')).toEqual({
      miracle_natural: { p1: 2 },
      laira: { p2: 1 },
    });
  });

  it('fills in a missing brand key as empty rather than dropping it', () => {
    const raw = JSON.stringify({ miracle_natural: { p1: 2 } });
    expect(parseStoredCart(raw, BRANDS, 'miracle_natural')).toEqual({
      miracle_natural: { p1: 2 },
      laira: {},
    });
  });

  it('ignores a brand key whose value is not an object', () => {
    const raw = JSON.stringify({ miracle_natural: { p1: 2 }, laira: 'not-an-object' });
    expect(parseStoredCart(raw, BRANDS, 'miracle_natural')).toEqual({
      miracle_natural: { p1: 2 },
      laira: {},
    });
  });

  it('does not mistake a partitioned cart with an unrelated extra key for legacy', () => {
    // Has at least one real brand key (miracle_natural), so it's not "legacy" —
    // the extra unknown key should just be ignored.
    const raw = JSON.stringify({ miracle_natural: { p1: 1 }, someExtraField: true });
    const result = parseStoredCart(raw, BRANDS, 'miracle_natural');
    expect(result).toEqual({ miracle_natural: { p1: 1 }, laira: {} });
  });
});

describe('mergeCartsOnLogin', () => {
  it('sums quantities for products present in both the server and local cart', () => {
    const server = { miracle_natural: { p1: 2 }, laira: {} };
    const local = { miracle_natural: { p1: 1, p2: 3 }, laira: {} };
    expect(mergeCartsOnLogin(server, local, BRANDS)).toEqual({
      miracle_natural: { p1: 3, p2: 3 },
      laira: {},
    });
  });

  it('keeps server-only products untouched', () => {
    const server = { miracle_natural: { p1: 5 }, laira: {} };
    const local = { miracle_natural: {}, laira: {} };
    expect(mergeCartsOnLogin(server, local, BRANDS)).toEqual({
      miracle_natural: { p1: 5 },
      laira: {},
    });
  });

  it('keeps local-only products untouched', () => {
    const server = { miracle_natural: {}, laira: {} };
    const local = { miracle_natural: { p1: 4 }, laira: {} };
    expect(mergeCartsOnLogin(server, local, BRANDS)).toEqual({
      miracle_natural: { p1: 4 },
      laira: {},
    });
  });

  it('merges independently per brand', () => {
    const server = { miracle_natural: { p1: 1 }, laira: { p9: 2 } };
    const local = { miracle_natural: { p1: 1 }, laira: { p9: 1, p10: 5 } };
    expect(mergeCartsOnLogin(server, local, BRANDS)).toEqual({
      miracle_natural: { p1: 2 },
      laira: { p9: 3, p10: 5 },
    });
  });

  it('handles an empty local cart (nothing to merge in)', () => {
    const server = { miracle_natural: { p1: 2 }, laira: {} };
    expect(mergeCartsOnLogin(server, {}, BRANDS)).toEqual({
      miracle_natural: { p1: 2 },
      laira: {},
    });
  });

  it('handles an empty server cart (fresh account, guest cart only)', () => {
    const local = { miracle_natural: { p1: 2 }, laira: {} };
    expect(mergeCartsOnLogin({ miracle_natural: {}, laira: {} }, local, BRANDS)).toEqual({
      miracle_natural: { p1: 2 },
      laira: {},
    });
  });

  it('does not mutate the input server or local carts', () => {
    const server = { miracle_natural: { p1: 2 }, laira: {} };
    const local = { miracle_natural: { p1: 1 }, laira: {} };
    mergeCartsOnLogin(server, local, BRANDS);
    expect(server).toEqual({ miracle_natural: { p1: 2 }, laira: {} });
    expect(local).toEqual({ miracle_natural: { p1: 1 }, laira: {} });
  });
});
