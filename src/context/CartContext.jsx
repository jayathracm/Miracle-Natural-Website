import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../lib/products';
import PRODUCT_IMAGES from '../data/productImages';

const CART_STORAGE_KEY = 'miracleNatural.cart';

// Shared across the whole app (not just Shop.jsx) so that a product's
// dedicated page (/shop/:id) — or, later, the Ritual Builder results, or
// any other entry point — can add to the same cart Shop.jsx's checkout
// reads from, instead of each page keeping its own disconnected copy.
const CartContext = createContext(undefined);

const readStoredCart = () => {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const CartProvider = ({ children }) => {
  const [productCatalog, setProductCatalog] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [cart, setCart] = useState(readStoredCart);

  useEffect(() => {
    let isMounted = true;

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
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Non-fatal — cart just won't survive a refresh this session.
    }
  }, [cart]);

  const addToCart = (productId, quantity = 1) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + quantity,
    }));
  };

  const addManyToCart = (items) => {
    setCart((prev) => {
      const next = { ...prev };
      items.forEach(({ productId, quantity }) => {
        next[productId] = (next[productId] || 0) + quantity;
      });
      return next;
    });
  };

  const changeQuantity = (productId, delta) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;

      if (next <= 0) {
        const { [productId]: _removed, ...rest } = prev;
        return rest;
      }

      return { ...prev, [productId]: next };
    });
  };

  const clearCart = () => setCart({});

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

  const value = {
    productCatalog,
    productById,
    isLoadingProducts,
    productsError,
    cart,
    cartItems,
    totalItems,
    totalAmount,
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
