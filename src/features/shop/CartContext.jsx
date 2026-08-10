import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchProducts } from '@/features/shop/products';
import { BRANDS } from '@/shared/lib/brands';
import PRODUCT_IMAGES from '@/features/shop/productImages';
import { fetchCart, syncCartForBrand } from '@/features/shop/cart';
import { useAuth } from '@/features/auth/AuthContext';

const CART_STORAGE_KEY = 'miracleNatural.cart';
// Remembers, per device/browser (not per tab — localStorage, not
// sessionStorage), which signed-in account's cart the *local* cart currently
// reflects. Lets the login-merge effect below tell "this account just logged
// in for the first time on this device, fold in whatever's in the guest
// cart" apart from "this is just a page reload/second tab for an account
// that's already synced" — without it, a reload would re-sum an
// already-synced local cart with the same server cart and double every
// quantity.
const CART_SYNCED_USER_KEY = 'miracleNatural.cart.syncedUserId';
const CART_SYNC_DEBOUNCE_MS = 800;
const BRAND_VALUES = BRANDS.map((entry) => entry.brand);

// Shared across the whole app (not just Shop.jsx) so that a product's
// dedicated page (/:brandSlug/shop/:id) — or, later, the Ritual Builder
// results, or any other entry point — can add to the same cart Shop.jsx's
// checkout reads from, instead of each page keeping its own disconnected
// copy.
//
// Three separate storefronts (Miracle Natural / Laira / Leora Wellness,
// functional-requirements.md §1.0) means three separate carts too — an
// item from one brand's shop should never show up in another brand's
// checkout. Rather than three independent contexts, the cart is one object
// partitioned by brand: `{ miracle_natural: {productId: qty}, laira: {...},
// leora_wellness: {...} }`. `useBrandCart(brand)` below wraps this into the
// same shape the old single-brand `useCart()` returned, so Shop.jsx and
// ProductDetail.jsx only needed to swap which hook they call.
const CartContext = createContext(undefined);

const emptyCartByBrand = () => Object.fromEntries(BRAND_VALUES.map((brand) => [brand, {}]));

const readStoredCart = () => {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') {
      return emptyCartByBrand();
    }

    // Carts saved before the brand split are a flat { productId: qty } map
    // with no brand keys at all — treat that legacy shape as the Miracle
    // Natural cart, since that was the only storefront that existed at the
    // time, rather than silently discarding a customer's in-progress cart.
    const looksLegacy = !BRAND_VALUES.some((brand) => brand in parsed);
    if (looksLegacy) {
      return { ...emptyCartByBrand(), miracle_natural: parsed };
    }

    const next = emptyCartByBrand();
    BRAND_VALUES.forEach((brand) => {
      if (parsed[brand] && typeof parsed[brand] === 'object') {
        next[brand] = parsed[brand];
      }
    });
    return next;
  } catch {
    return emptyCartByBrand();
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [productCatalog, setProductCatalog] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [cartByBrand, setCartByBrand] = useState(readStoredCart);
  // Starts as `undefined` (never observed), distinct from `null` (observed,
  // and signed out) — so the very first render, before we know whether
  // there's a session at all, never gets mistaken for "just signed out" and
  // wipes a guest's local cart. See the sign-out branch below.
  const previousUserIdRef = useRef(undefined);

  useEffect(() => {
    let isMounted = true;

    // No brand filter here — the full catalog is fetched once and split by
    // brand client-side (see productsByBrand below), since it's small and
    // this avoids three separate round trips.
    fetchProducts()
      .then((rows) => {
        if (!isMounted) return;
        const withImages = rows.map((product) => ({
          ...product,
          image: PRODUCT_IMAGES[product.id] || product.image_url || null,
        }));
        setProductCatalog(withImages);
      })
      .catch((error) => {
        if (!isMounted) return;
        setProductsError(error.message || 'Could not load products. Please refresh the page.');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingProducts(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartByBrand));
    } catch {
      // Non-fatal — cart just won't survive a refresh this session.
    }
  }, [cartByBrand]);

  // Runs on sign-in and sign-out (not on every render — only when the user
  // id actually changes). See docs at CART_SYNCED_USER_KEY above for why the
  // sign-in branch needs the localStorage marker, not just a merge-on-login.
  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = currentUserId;

    if (currentUserId) {
      let lastSyncedUserId = null;
      try {
        lastSyncedUserId = window.localStorage.getItem(CART_SYNCED_USER_KEY);
      } catch {
        // Non-fatal — falls through to treating this as a first sync.
      }
      const isFirstSyncForThisAccountOnThisDevice = lastSyncedUserId !== currentUserId;

      fetchCart()
        .then((serverCartByBrand) => {
          setCartByBrand((prevLocal) => {
            if (!isFirstSyncForThisAccountOnThisDevice) {
              // Local storage already reflects this account's last-synced
              // cart (a page reload, or a second tab) — just refresh from
              // the server (in case another device changed it since) rather
              // than summing local+server again, which would double every
              // quantity already in both.
              return serverCartByBrand;
            }
            // First time this account has been active on this device —
            // fold in whatever was added to the cart before logging in
            // (guest browsing, or a different account's now-cleared cart)
            // instead of silently discarding it.
            const merged = emptyCartByBrand();
            BRAND_VALUES.forEach((brand) => {
              merged[brand] = { ...serverCartByBrand[brand] };
              Object.entries(prevLocal[brand] || {}).forEach(([productId, quantity]) => {
                merged[brand][productId] = (merged[brand][productId] || 0) + quantity;
              });
            });
            return merged;
          });
        })
        .catch(() => {
          // Best-effort — if the fetch fails, keep whatever's local rather
          // than blocking shopping on a cart-sync error.
        })
        .finally(() => {
          try {
            window.localStorage.setItem(CART_SYNCED_USER_KEY, currentUserId);
          } catch {
            // Non-fatal.
          }
        });
    } else if (previousUserId) {
      // A real sign-out (previousUserId was set, meaning we'd actually
      // observed a signed-in user before) — clear the local cart so the
      // next person on this device/browser doesn't see the previous
      // account's items. Nothing is lost: it's saved server-side and will
      // be restored the next time this account logs in on any device.
      setCartByBrand(emptyCartByBrand());
      try {
        window.localStorage.removeItem(CART_SYNCED_USER_KEY);
      } catch {
        // Non-fatal.
      }
    }
  }, [user?.id]);

  // Pushes the local cart to the server whenever it changes while signed
  // in — covers both the customer's own edits (add/remove/change quantity)
  // and the merge above (which updates cartByBrand like any other change,
  // so it's persisted the same way). Debounced so rapid quantity clicks
  // don't fire a request per click.
  useEffect(() => {
    if (!user?.id) return undefined;

    const timeoutId = window.setTimeout(() => {
      BRAND_VALUES.forEach((brand) => {
        syncCartForBrand(brand, cartByBrand[brand] || {}).catch(() => {
          // Best-effort — a failed background save just means this
          // device's cart catches up on the next change; nothing to
          // interrupt the customer's shopping over.
        });
      });
    }, CART_SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [cartByBrand, user?.id]);

  const addToCart = (brand, productId, quantity = 1) => {
    setCartByBrand((prev) => ({
      ...prev,
      [brand]: {
        ...prev[brand],
        [productId]: (prev[brand]?.[productId] || 0) + quantity,
      },
    }));
  };

  const addManyToCart = (brand, items) => {
    setCartByBrand((prev) => {
      const nextBrandCart = { ...prev[brand] };
      items.forEach(({ productId, quantity }) => {
        nextBrandCart[productId] = (nextBrandCart[productId] || 0) + quantity;
      });
      return { ...prev, [brand]: nextBrandCart };
    });
  };

  const changeQuantity = (brand, productId, delta) => {
    setCartByBrand((prev) => {
      const current = prev[brand]?.[productId] || 0;
      const next = current + delta;
      const nextBrandCart = { ...prev[brand] };

      if (next <= 0) {
        delete nextBrandCart[productId];
      } else {
        nextBrandCart[productId] = next;
      }

      return { ...prev, [brand]: nextBrandCart };
    });
  };

  const clearCart = (brand) => {
    setCartByBrand((prev) => ({ ...prev, [brand]: {} }));
  };

  const productById = useMemo(() => {
    const map = new Map();
    productCatalog.forEach((product) => map.set(product.id, product));
    return map;
  }, [productCatalog]);

  const productsByBrand = useMemo(() => {
    const map = emptyCartByBrand();
    Object.keys(map).forEach((brand) => { map[brand] = []; });
    productCatalog.forEach((product) => {
      if (!map[product.brand]) map[product.brand] = [];
      map[product.brand].push(product);
    });
    return map;
  }, [productCatalog]);

  const value = {
    productCatalog,
    productsByBrand,
    productById,
    isLoadingProducts,
    productsError,
    cartByBrand,
    addToCart,
    addManyToCart,
    changeQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally colocated with its provider
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Scopes the shared, brand-partitioned cart down to one brand, in the same
// shape the pre-split `useCart()` used to return — so callers only deal with
// "their" storefront's cart and never need to think about the other two.
// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally colocated with its provider
export const useBrandCart = (brand) => {
  const ctx = useCart();
  // Memoized (rather than `|| {}` / `|| []` inline) so an invalid/undefined
  // brand — which falls back to a fresh literal every render — doesn't
  // change identity on every render and invalidate the useMemos below.
  const cart = useMemo(() => ctx.cartByBrand[brand] || {}, [ctx.cartByBrand, brand]);
  const productCatalog = useMemo(() => ctx.productsByBrand[brand] || [], [ctx.productsByBrand, brand]);

  // Scoped to this brand's own catalog (not the cross-brand map on the raw
  // context) so a URL like /laira/shop/<a-miracle-natural-product-id>
  // correctly resolves to "not found" instead of leaking another brand's
  // product into this storefront.
  const productById = useMemo(() => {
    const map = new Map();
    productCatalog.forEach((product) => map.set(product.id, product));
    return map;
  }, [productCatalog]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = productById.get(productId);
        if (!product) return null;
        return { ...product, quantity, lineTotal: product.price * quantity };
      })
      .filter(Boolean);
  }, [cart, productById]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartItems]
  );

  return {
    productCatalog,
    productById,
    isLoadingProducts: ctx.isLoadingProducts,
    productsError: ctx.productsError,
    cart,
    cartItems,
    totalItems,
    totalAmount,
    addToCart: (productId, quantity) => ctx.addToCart(brand, productId, quantity),
    addManyToCart: (items) => ctx.addManyToCart(brand, items),
    changeQuantity: (productId, delta) => ctx.changeQuantity(brand, productId, delta),
    clearCart: () => ctx.clearCart(brand),
  };
};
