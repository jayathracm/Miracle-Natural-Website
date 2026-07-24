import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../lib/products';
import { BRANDS } from '../lib/brands';
import PRODUCT_IMAGES from '../data/productImages';

const CART_STORAGE_KEY = 'miracleNatural.cart';
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
  const [productCatalog, setProductCatalog] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [cartByBrand, setCartByBrand] = useState(readStoredCart);

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
