import React, { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { ProductGridSkeleton, Skeleton } from '../components/ui/Skeleton';
import { ProductCard } from '../components/shop/ProductCard';
import { ProductDetailModal } from '../components/shop/ProductDetailModal';
import { ShopCart } from '../components/shop/ShopCart';
import { fetchProducts } from '../lib/products';
import PRODUCT_IMAGES from '../data/productImages';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import DELIVERY_ZONES from '../data/deliveryZones';
import { addToWishlist, fetchWishlistProductIds, removeFromWishlist } from '../lib/wishlist';
import { fetchAddresses } from '../lib/addresses';
import { staggerContainer } from '../lib/motionVariants';

const ORDER_EMAIL = import.meta.env.VITE_ORDER_EMAIL || 'dinisha@lanmic.com';
const CART_STORAGE_KEY = 'miracleNatural.cart';

const formatCurrency = (amount) => `LKR ${amount.toLocaleString('en-LK')}`;

const SHOP_CATEGORY_ORDER = ['Face Care', 'Body Care', 'Hair Care', 'Lip Care'];

const SHOP_CATEGORY_MAP = {
  'Face Care': 'Face Care',
  Treatment: 'Face Care',
  'Weekly Care': 'Face Care',
  'Body Care': 'Body Care',
  'Hair Care': 'Hair Care',
  'Lip Care': 'Lip Care',
};

const getShopCategory = (product) => SHOP_CATEGORY_MAP[product.category] || product.category;

// Cart persists across reloads via localStorage — nothing modern-ecommerce
// feels worse than an accidental refresh wiping out a cart.
const readStoredCart = () => {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const ShopPage = () => {
  const { user } = useAuth();
  const [productCatalog, setProductCatalog] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [cart, setCart] = useState(readStoredCart);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [showOrderSuccessPopup, setShowOrderSuccessPopup] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortOption, setSortOption] = useState('featured');
  const [wishlistIds, setWishlistIds] = useState(() => new Set());
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('manual');

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Non-fatal — cart just won't survive a refresh this session.
    }
  }, [cart]);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setWishlistIds(new Set());
      return undefined;
    }

    fetchWishlistProductIds()
      .then((ids) => {
        if (isMounted) setWishlistIds(new Set(ids));
      })
      .catch(() => {
        // Non-fatal — heart icons just won't reflect saved state this load.
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setSavedAddresses([]);
      setSelectedAddressId('manual');
      return undefined;
    }

    fetchAddresses()
      .then((addresses) => {
        if (!isMounted) return;
        setSavedAddresses(addresses);
        const defaultAddress = addresses.find((address) => address.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setDeliveryZone(defaultAddress.delivery_zone);
          setDeliveryAddress(defaultAddress.address_text);
        }
      })
      .catch(() => {
        // Non-fatal — checkout still works with manual entry.
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSelectSavedAddress = (addressId) => {
    setSelectedAddressId(addressId);
    if (addressId === 'manual') return;

    const address = savedAddresses.find((item) => item.id === addressId);
    if (address) {
      setDeliveryZone(address.delivery_zone);
      setDeliveryAddress(address.address_text);
    }
  };

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

  const cartItems = useMemo(() => {
    return productCatalog
      .filter((product) => (cart[product.id] || 0) > 0)
      .map((product) => {
        const quantity = cart[product.id];
        return {
          ...product,
          quantity,
          lineTotal: product.price * quantity,
        };
      });
  }, [cart, productCatalog]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartItems]
  );

  const shippingCost = useMemo(() => {
    if (!deliveryZone) return 0;
    return DELIVERY_ZONES[deliveryZone]?.rate || 0;
  }, [deliveryZone]);

  const deliveryZoneLabel = useMemo(() => {
    if (!deliveryZone) return '';
    return DELIVERY_ZONES[deliveryZone]?.label || '';
  }, [deliveryZone]);

  const grandTotal = useMemo(() => totalAmount + shippingCost, [totalAmount, shippingCost]);

  const categoryCounts = useMemo(() => {
    const counts = SHOP_CATEGORY_ORDER.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {});

    productCatalog.forEach((product) => {
      const normalizedCategory = getShopCategory(product);
      if (Object.prototype.hasOwnProperty.call(counts, normalizedCategory)) {
        counts[normalizedCategory] += 1;
      }
    });

    return counts;
  }, [productCatalog]);

  const filteredProducts = useMemo(() => {
    const categoryAndPriceFiltered = productCatalog.filter((product) => {
      const normalizedCategory = getShopCategory(product);

      if (categoryFilter !== 'all' && normalizedCategory !== categoryFilter) {
        return false;
      }

      if (priceFilter === 'under_500') {
        return product.price < 500;
      }

      if (priceFilter === '500_1500') {
        return product.price >= 500 && product.price <= 1500;
      }

      if (priceFilter === '1501_3000') {
        return product.price > 1500 && product.price <= 3000;
      }

      if (priceFilter === 'above_3000') {
        return product.price > 3000;
      }

      return true;
    });

    if (sortOption === 'price_low_to_high') {
      return [...categoryAndPriceFiltered].sort((a, b) => a.price - b.price);
    }

    if (sortOption === 'price_high_to_low') {
      return [...categoryAndPriceFiltered].sort((a, b) => b.price - a.price);
    }

    if (sortOption === 'name_a_to_z') {
      return [...categoryAndPriceFiltered].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
    }

    if (sortOption === 'name_z_to_a') {
      return [...categoryAndPriceFiltered].sort((a, b) => b.name.localeCompare(a.name, 'en', { sensitivity: 'base' }));
    }

    return categoryAndPriceFiltered;
  }, [categoryFilter, priceFilter, sortOption, productCatalog]);

  const addToCart = (productId) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
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

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const pushToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      removeToast(id);
    }, 4200);
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      pushToast('error', 'Sign in to save items to your wishlist.');
      return;
    }

    const isWishlisted = wishlistIds.has(productId);

    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (isWishlisted) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch {
      setWishlistIds((prev) => {
        const reverted = new Set(prev);
        if (isWishlisted) {
          reverted.add(productId);
        } else {
          reverted.delete(productId);
        }
        return reverted;
      });
      pushToast('error', 'Could not update your wishlist. Please try again.');
    }
  };

  const handleEmailOrder = async () => {
    if (cartItems.length === 0) {
      pushToast('error', 'Your shopping cart is empty. Add at least one product to continue.');
      return;
    }
    if (!customerName.trim()) {
      pushToast('error', 'Please enter your name before placing the order.');
      return;
    }
    if (!customerPhone.trim()) {
      pushToast('error', 'Please enter your phone number before placing the order.');
      return;
    }
    if (!customerEmail.trim()) {
      pushToast('error', 'Please enter your email address before placing the order.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      pushToast('error', 'Please enter a valid email address.');
      return;
    }
    if (!deliveryZone || !deliveryAddress.trim()) {
      pushToast('error', 'Please select a delivery zone and enter the delivery address before placing the order.');
      return;
    }

    if (isSendingOrder) return;

    const subject = `New Miracle Natural Order - ${customerName || 'Customer'}`;
    const orderLines = cartItems.map(
      (item) => `- ${item.name} (${item.size}) x ${item.quantity} = ${formatCurrency(item.lineTotal)}`
    );

    const body = [
      'Hello,',
      '',
      'I would like to place an order with the following products:',
      '',
      ...orderLines,
      '',
      `Total Items: ${totalItems}`,
      `Subtotal: ${formatCurrency(totalAmount)}`,
      `Shipping (${deliveryZoneLabel}): ${formatCurrency(shippingCost)}`,
      `Grand Total: ${formatCurrency(grandTotal)}`,
      '',
      'Customer Details:',
      `Name: ${customerName || 'Not provided'}`,
      `Phone: ${customerPhone || 'Not provided'}`,
      `Email: ${customerEmail}`,
      `Payment Method: Cash on Delivery`,
      `Delivery Zone: ${deliveryZoneLabel}`,
      `Delivery Address: ${deliveryAddress}`,
      `Notes: ${customerNotes || 'None'}`,
      '',
      'Delivery Charges:',
      '- Colombo (1-15) - Rs.300/-',
      '- Other Areas - Rs.350/-',
      '',
      `Order Date: ${new Date().toLocaleString()}`,
    ].join('\n');

    setIsSendingOrder(true);

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        payment_method: 'cash_on_delivery',
        delivery_zone: deliveryZone,
        delivery_address: deliveryAddress.trim(),
        subtotal: totalAmount,
        shipping_cost: shippingCost,
        grand_total: grandTotal,
        notes: customerNotes.trim() || null,
      })
      .select('id')
      .single();

    if (orderError || !orderRow) {
      pushToast('error', 'Could not save your order. Please try again.');
      setIsSendingOrder(false);
      return;
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      cartItems.map((item) => ({
        order_id: orderRow.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        line_total: item.lineTotal,
      }))
    );

    if (itemsError) {
      pushToast('error', 'Order saved, but item details failed to record. Our team will follow up with you directly.');
    }

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(ORDER_EMAIL)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: subject,
          _captcha: 'false',
          _template: 'table',
          name: customerName || 'Website Customer',
          phone: customerPhone || 'Not provided',
          customer_email: customerEmail.trim(),
          payment_method: 'Cash on Delivery',
          delivery_zone: deliveryZoneLabel,
          delivery_address: deliveryAddress,
          notes: customerNotes || 'None',
          total_items: totalItems,
          subtotal: formatCurrency(totalAmount),
          shipping: formatCurrency(shippingCost),
          grand_total: formatCurrency(grandTotal),
          order_items: orderLines.join('\n'),
          order_message: body,
        }),
      });

      const result = await response.json();
      if (!response.ok || result?.success === 'false') {
        throw new Error(result?.message || 'Failed to send order email.');
      }
    } catch {
      // Non-fatal: the order is already saved in the database and will show
      // up for admins regardless of whether this notification email went out.
    }

    setShowOrderSuccessPopup(true);
    pushToast('success', 'Order placed successfully.');
    setCart({});
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerNotes('');
    setDeliveryZone('');
    setDeliveryAddress('');
    setIsSendingOrder(false);
  };

  const cartProps = {
    cartItems,
    totalItems,
    subtotal: totalAmount,
    shippingCost,
    deliveryZoneLabel,
    grandTotal,
    onChangeQuantity: changeQuantity,
    user,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    customerNotes,
    setCustomerNotes,
    deliveryZone,
    setDeliveryZone,
    deliveryAddress,
    setDeliveryAddress,
    savedAddresses,
    selectedAddressId,
    onSelectSavedAddress: handleSelectSavedAddress,
    isSendingOrder,
    onSubmitOrder: handleEmailOrder,
  };

  return (
    <div className="pt-28 sm:pt-30 md:pt-32 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1320px] mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Typography variant="label" className="mb-2 block">Shop</Typography>
            <Typography variant="h2" className="text-foreground">All Products</Typography>
          </div>
          {!isLoadingProducts && !productsError && (
            <p className="text-[0.82rem] text-muted-foreground">
              Showing {filteredProducts.length} of {productCatalog.length} products
            </p>
          )}
        </div>

        {productsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {productsError}
          </div>
        ) : isLoadingProducts ? (
          <section>
            <div className="mb-5">
              <Skeleton className="h-11 w-full" />
            </div>
            <ProductGridSkeleton count={10} />
          </section>
        ) : (
          <>
            <section>
              <div className="mb-5 flex flex-wrap items-center gap-2.5">
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-lg border border-[var(--color-border-medium)] bg-white px-3 py-2 text-[0.84rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Categories</option>
                  {SHOP_CATEGORY_ORDER.map((category) => (
                    <option key={category} value={category}>{category} ({categoryCounts[category] || 0})</option>
                  ))}
                </select>

                <select
                  value={priceFilter}
                  onChange={(event) => setPriceFilter(event.target.value)}
                  className="rounded-lg border border-[var(--color-border-medium)] bg-white px-3 py-2 text-[0.84rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Prices</option>
                  <option value="under_500">Under LKR 500</option>
                  <option value="500_1500">LKR 500 - 1,500</option>
                  <option value="1501_3000">LKR 1,501 - 3,000</option>
                  <option value="above_3000">Above LKR 3,000</option>
                </select>

                <select
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value)}
                  className="rounded-lg border border-[var(--color-border-medium)] bg-white px-3 py-2 text-[0.84rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price_low_to_high">Price: Low to High</option>
                  <option value="price_high_to_low">Price: High to Low</option>
                  <option value="name_a_to_z">Name: A to Z</option>
                  <option value="name_z_to_a">Name: Z to A</option>
                </select>

                {(categoryFilter !== 'all' || priceFilter !== 'all' || sortOption !== 'featured') && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('all');
                      setPriceFilter('all');
                      setSortOption('featured');
                    }}
                    className="text-[0.78rem] font-semibold text-primary underline underline-offset-2"
                  >
                    Reset
                  </button>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-[var(--color-border-light)] bg-white px-5 py-10 text-center text-[0.95rem] text-muted-foreground">
                  No products match your current filters.
                </div>
              ) : (
                <motion.div
                  key={`${categoryFilter}-${priceFilter}-${sortOption}`}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4"
                  variants={staggerContainer(0.05)}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={getShopCategory(product)}
                      quantity={cart[product.id] || 0}
                      isWishlisted={wishlistIds.has(product.id)}
                      onAddToCart={addToCart}
                      onToggleWishlist={toggleWishlist}
                      onOpenDetail={setSelectedProduct}
                    />
                  ))}
                </motion.div>
              )}
            </section>

            <ShopCart {...cartProps} />
          </>
        )}
      </div>

      {toasts.length > 0 && (
        <div className="fixed bottom-20 right-4 sm:right-6 lg:bottom-24 z-[110] flex w-[min(92vw,390px)] flex-col-reverse gap-2.5">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`group relative overflow-hidden rounded-2xl border px-4 py-3.5 shadow-[0_20px_45px_rgba(18,30,24,0.24)] backdrop-blur-md transition-all duration-300 ${toast.type === 'error' ? 'border-[rgba(214,96,96,0.38)] bg-[linear-gradient(135deg,rgba(255,246,246,0.95),rgba(255,236,236,0.88))]' : 'border-[rgba(95,148,118,0.34)] bg-[linear-gradient(135deg,rgba(247,255,250,0.96),rgba(237,250,242,0.9))]'}`}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] ${toast.type === 'error' ? 'bg-[linear-gradient(90deg,rgba(208,70,70,0.2),rgba(208,70,70,0.9),rgba(208,70,70,0.2))]' : 'bg-[linear-gradient(90deg,rgba(87,151,111,0.2),rgba(87,151,111,0.9),rgba(87,151,111,0.2))]'}`} />
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${toast.type === 'error' ? 'border-[rgba(202,74,74,0.3)] bg-[rgba(255,239,239,0.85)] text-red-700' : 'border-[rgba(88,145,113,0.3)] bg-[rgba(240,252,244,0.9)] text-emerald-700'}`}>
                  {toast.type === 'error' ? <X size={13} /> : <CheckCircle2 size={14} />}
                </span>
                <p className={`pt-0.5 text-[0.84rem] leading-relaxed ${toast.type === 'error' ? 'text-[rgb(120,35,35)]' : 'text-[rgb(33,86,55)]'}`}>{toast.message}</p>
                <button
                  type="button"
                  className={`ml-auto rounded-md px-2 py-1 text-[0.7rem] font-semibold tracking-[0.03em] transition-colors ${toast.type === 'error' ? 'text-red-700 hover:bg-[rgba(209,94,94,0.12)]' : 'text-emerald-700 hover:bg-[rgba(88,146,112,0.12)]'}`}
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showOrderSuccessPopup && (
        <div
          className="fixed inset-0 z-[95] bg-[rgba(13,20,16,0.58)] backdrop-blur-sm px-4 py-8 sm:px-6 sm:py-12"
          onClick={() => setShowOrderSuccessPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Order confirmation"
        >
          <div
            className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.96))] p-6 sm:p-7 shadow-[0_30px_80px_rgba(8,14,10,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -top-14 -right-12 h-40 w-40 rounded-full bg-primary/18 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-secondary/22 blur-2xl" />
            <div className="pointer-events-none absolute top-3 right-3 text-primary/55">
              <Sparkles size={18} />
            </div>

            <div className="relative z-10">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/12 border border-primary/25 inline-flex items-center justify-center">
                <CheckCircle2 size={34} className="text-primary" />
              </div>

              <Typography variant="h4" className="text-center text-foreground mb-2 font-extrabold">
                Thank You For Your Order!
              </Typography>

              <p className="text-center text-[0.95rem] leading-relaxed text-muted-foreground mb-6">
                Your order was sent successfully. A team member will get back to you once the order is confirmed via email.
              </p>

              <div className="flex justify-center">
                <Button
                  className="px-6 py-2.5 text-[0.74rem]"
                  onClick={() => setShowOrderSuccessPopup(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          category={getShopCategory(selectedProduct)}
          isWishlisted={wishlistIds.has(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onToggleWishlist={toggleWishlist}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
};

export default ShopPage;
