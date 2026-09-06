// @vitest-environment jsdom
// End-to-end tests for the addToCart/changeQuantity/clearCart hook itself —
// the CartProvider is mounted for real, only the Supabase-backed modules
// (product fetch, cart fetch/sync) and auth are mocked out. Closes the gap
// between the pure cartMerge.js tests and how useBrandCart actually behaves.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { CartProvider, useBrandCart } from './CartContext';

// vi.mock(...) is hoisted above this file's own top-level declarations, so
// the catalog has to be built inside the factory rather than referenced
// from a module-level const (that would throw "Cannot access before
// initialization" — the const doesn't exist yet when the hoisted mock runs).
vi.mock('@/features/shop/products', () => ({
  fetchProducts: vi.fn().mockResolvedValue([
    { id: 'p1', name: 'Aloe Vera Gel', price: 1000, brand: 'miracle_natural', category: 'Face Care' },
    { id: 'p2', name: 'Neem Face Oil', price: 500, brand: 'miracle_natural', category: 'Face Care' },
  ]),
}));

vi.mock('@/features/shop/cart', () => ({
  fetchCart: vi.fn(),
  syncCartForBrand: vi.fn(),
}));

// No signed-in user — keeps this test focused on local cart state, not the
// login-merge path (already covered by cartMerge.test.js).
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/features/shop/productImages', () => ({ default: {} }));

function wrapper({ children }) {
  return <CartProvider>{children}</CartProvider>;
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => cleanup());

describe('useBrandCart — end to end through CartProvider', () => {
  it('starts empty, and addToCart(productId) adds one line with quantity 1', async () => {
    const { result } = renderHook(() => useBrandCart('miracle_natural'), { wrapper });
    await waitFor(() => expect(result.current.isLoadingProducts).toBe(false));

    expect(result.current.cartItems).toEqual([]);

    act(() => {
      result.current.addToCart('p1');
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0]).toMatchObject({ id: 'p1', quantity: 1, lineTotal: 1000 });
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalAmount).toBe(1000);
  });

  it('addToCart on the same product again sums the quantity instead of adding a new line', async () => {
    const { result } = renderHook(() => useBrandCart('miracle_natural'), { wrapper });
    await waitFor(() => expect(result.current.isLoadingProducts).toBe(false));

    act(() => {
      result.current.addToCart('p1');
      result.current.addToCart('p1');
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(2);
    expect(result.current.totalAmount).toBe(2000);
  });

  it('changeQuantity increases and decreases a line, and removes it once it hits zero', async () => {
    const { result } = renderHook(() => useBrandCart('miracle_natural'), { wrapper });
    await waitFor(() => expect(result.current.isLoadingProducts).toBe(false));

    act(() => {
      result.current.addToCart('p1', 2);
    });
    expect(result.current.cart).toEqual({ p1: 2 });

    act(() => {
      result.current.changeQuantity('p1', 1);
    });
    expect(result.current.cart).toEqual({ p1: 3 });

    act(() => {
      result.current.changeQuantity('p1', -3);
    });
    expect(result.current.cart).toEqual({});
    expect(result.current.cartItems).toEqual([]);
  });

  it('clearCart only empties the given brand, leaving other brands untouched', async () => {
    const { result } = renderHook(
      () => ({
        mn: useBrandCart('miracle_natural'),
        laira: useBrandCart('laira'),
      }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.mn.isLoadingProducts).toBe(false));

    act(() => {
      result.current.mn.addToCart('p1');
      result.current.laira.addToCart('some-laira-product');
    });

    expect(result.current.mn.cart).toEqual({ p1: 1 });
    expect(result.current.laira.cart).toEqual({ 'some-laira-product': 1 });

    act(() => {
      result.current.mn.clearCart();
    });

    expect(result.current.mn.cart).toEqual({});
    expect(result.current.laira.cart).toEqual({ 'some-laira-product': 1 });
  });
});
