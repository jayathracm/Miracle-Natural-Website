import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchProducts } from '@/features/shop/products';
import { BRANDS } from '@/shared/lib/brands';
import PRODUCT_IMAGES from '@/features/shop/productImages';
import { fetchCart, syncCartForBrand } from '@/features/shop/cart';
import { useAuth } from '@/features/auth/AuthContext';

const CART_STORAGE_KEY = 'miracleNatural.cart';
// Which account's cart the local cart currently reflects on this device.
// Lets us tell "just logged in, merge in the guest cart" apart from "same
// account, just a reload" — otherwise a reload would double every quantity.
const CART_SYNCED_USER_KEY = 'miracleNatural.cart.syncedUserId';
const CART_SYNC_DEBOUNCE_MS = 800;
const BRAND_VALUES = BRANDS.map((entry) => entry.brand);

// Shared app-wide so any entry point (Shop.jsx, product pages, Ritual
// Builder) adds to the same cart. One cart per brand (Miracle Natural /
// Laira / Leora Wellness) so items don't cross storefronts:
// { miracle_natural: {productId: qty}, laira: {...}, leora_wellness: {...} }.
const CartContext = createContext(undefined);

const emptyCartByBrand = () => Object.fromEntries(BRAND_VALUES.map((brand) => [brand, {}]));

const readStoredCart = () => {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') {
      return emptyCartByBrand();
    }

    // Old carts (pre brand-split) are a flat { productId: qty } map.
    // Treat that as the Miracle Natural cart instead of discarding it.
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
  // undefined = never checked yet, null = checked and signed out. Keeps the
  // very first render from being mistaken for a sign-out and wiping a
  // guest's cart.
  const previousUserIdRef = useRef(undefined);

  useEffect(() => {
    let isMounted = true;

    // Fetch the whole catalog once, split by brand client-side below.
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

  // Runs only when the signed-in user actually changes (sign-in/sign-out).
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
              // Already synced on this device — just refresh from the
              // server instead of summing again (would double quantities).
              return serverCartByBrand;
            }
            // First time this account's active on this device — merge in
            // whatever was in the cart before logging in.
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
          // Best-effort — keep the local cart if the fetch fails.
        })
        .finally(() => {
          try {
            window.localStorage.setItem(CART_SYNCED_USER_KEY, currentUserId);
          } catch {
            // Non-fatal.
          }
        });
    } else if (previousUserId) {
      // Real sign-out — clear the local cart so the next person on this
      // device doesn't see it. Nothing's lost, it's saved server-side.
      setCartByBrand(emptyCartByBrand());
      try {
        window.localStorage.removeItem(CART_SYNCED_USER_KEY);
      } catch {
        // Non-fatal.
      }
    }
  }, [user?.id]);

  // Pushes the local cart to the server on every change while signed in.
  // Debounced so rapid quantity clicks don't fire a request each time.
  useEffect(() => {
    if (!user?.id) return undefined;

    const timeoutId = window.setTimeout(() => {
      BRAND_VALUES.forEach((brand) => {
        syncCartForBrand(brand, cartByBrand[brand] || {}).catch(() => {
          // Best-effort — a failed save just catches up next change.
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

// Scopes the shared cart down to one brand, same shape the old
// single-brand useCart() returned.
// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally colocated with its provider
export const useBrandCart = (brand) => {
  const ctx = useCart();
  // Memoized so an invalid/undefined brand doesn't change identity every
  // render and invalidate the useMemos below.
  const cart = useMemo(() => ctx.cartByBrand[brand] || {}, [ctx.cartByBrand, brand]);
  const productCatalog = useMemo(() => ctx.productsByBrand[brand] || [], [ctx.productsByBrand, brand]);

  // Scoped to this brand's catalog so another brand's product id can't
  // leak into this storefront.
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
