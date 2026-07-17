import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, ImageOff, LayoutGrid, List, Search, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { ProductGridSkeleton, Skeleton } from '../components/ui/Skeleton';
import { ProductCard } from '../components/shop/ProductCard';
import { ProductDetailModal } from '../components/shop/ProductDetailModal';
import { ShopCart } from '../components/shop/ShopCart';
import PRODUCT_IMAGES from '../data/productImages';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../hooks/useWishlist';
import DELIVERY_ZONES from '../data/deliveryZones';
import { fetchAddresses } from '../lib/addresses';
import { calculateB2BPrice } from '../lib/b2bPricing';
import { decrementInventoryForOrder } from '../lib/inventory';
import { submitQuotation } from '../lib/quotations';
import { staggerContainer } from '../lib/motionVariants';
import { SHOP_CATEGORY_ORDER, getShopCategory } from '../lib/shopCategories';

const ORDER_EMAIL = import.meta.env.VITE_ORDER_EMAIL || 'dinisha@lanmic.com';
const PRODUCTS_PER_PAGE = 12;

const PRICE_FILTERS = [
  { value: 'all', label: 'All Prices' },
  { value: 'under_500', label: 'Under LKR 500' },
  { value: '500_1500', label: 'LKR 500 - 1,500' },
  { value: '1501_3000', label: 'LKR 1,501 - 3,000' },
  { value: 'above_3000', label: 'Above LKR 3,000' },
];

const formatCurrency = (amount) => `LKR ${amount.toLocaleString('en-LK')}`;

const ShopPage = () => {
  const { user, isCorporatePartner, isAdmin } = useAuth();
  const isWholesaleEligible = isCorporatePartner || isAdmin;
  const location = useLocation();
  const navigate = useNavigate();
  const {
    productCatalog,
    isLoadingProducts,
    productsError,
    cart,
    cartItems,
    totalItems,
    addToCart,
    addManyToCart,
    changeQuantity,
    clearCart,
  } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [showOrderSuccessPopup, setShowOrderSuccessPopup] = useState(false);
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  const [showQuoteSuccessPopup, setShowQuoteSuccessPopup] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortOption, setSortOption] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('manual');
  const [bundlePopup, setBundlePopup] = useState(null);
  const [cartOpenSignal, setCartOpenSignal] = useState(0);
  const [wholesalePricing, setWholesalePricing] = useState({});

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

  const { wishlistIds, toggleWishlist } = useWishlist({
    onError: (message) => pushToast('error', message),
  });

  // Arriving here from a bundle's "Buy This Bundle" button (PricingSection)
  // carries the bundle's real products via navigation state. Add them to
  // the cart straight away and surface a confirmation — then clear the
  // state so a refresh or back-navigation doesn't silently re-add them.
  // The same navigation-state channel is used by ProductDetail.jsx's "View
  // Cart" action (`{ openCart: true }`) to pop the floating cart drawer open
  // on arrival, without needing to lift cart-drawer UI state into context.
  useEffect(() => {
    const state = location.state;
    if (!state) return;

    if (state.bundlePurchase) {
      addManyToCart(
        state.bundlePurchase.items.map(({ product, quantity }) => ({ productId: product.id, quantity }))
      );
      setBundlePopup(state.bundlePurchase);
    } else if (state.openCart) {
      setCartOpenSignal(Date.now());
    }

    navigate(location.pathname, { replace: true, state: null });
    // Only ever meant to run for the navigation that carried this state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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

  const shippingCost = useMemo(() => {
    if (!deliveryZone) return 0;
    return DELIVERY_ZONES[deliveryZone]?.rate || 0;
  }, [deliveryZone]);

  const deliveryZoneLabel = useMemo(() => {
    if (!deliveryZone) return '';
    return DELIVERY_ZONES[deliveryZone]?.label || '';
  }, [deliveryZone]);

  // Bulk ordering (functional-requirements §2.3): a Corporate Partner's cart
  // totals should reflect the same discount-tier math as WholesalePricingPanel
  // on the product page, not flat retail pricing. Recomputed per line item
  // (not just the overall quantity) since MOQ/tier eligibility is evaluated
  // per product, exactly like calculate_b2b_price does server-side. Debounced
  // so rapid +/- clicks on cart quantities don't fire a request per click.
  // Deliberately scoped to this page (not lifted into CartContext) — nothing
  // else in the app reads cartItems, so there's no risk of silently changing
  // prices shown elsewhere (ProductCard, RitualBuilder, bundle popups all
  // show retail pricing, which is correct — this is purely a checkout-time
  // adjustment for eligible accounts).
  useEffect(() => {
    if (!isWholesaleEligible || cartItems.length === 0) {
      setWholesalePricing({});
      return undefined;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      Promise.all(
        cartItems.map((item) =>
          calculateB2BPrice(item.id, item.quantity)
            .then((pricing) => [item.id, pricing])
            .catch(() => [item.id, null])
        )
      ).then((results) => {
        if (isCancelled) return;
        const next = {};
        results.forEach(([productId, pricing]) => {
          if (pricing) next[productId] = pricing;
        });
        setWholesalePricing(next);
      });
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
    // cartItems is a derived array (stable reference unless cart/catalog
    // actually change), so it's safe as a dependency here.
  }, [isWholesaleEligible, cartItems]);

  const effectiveCartItems = useMemo(() => {
    return cartItems.map((item) => {
      const pricing = wholesalePricing[item.id];
      const applies = isWholesaleEligible && pricing && pricing.meetsMoq && pricing.appliedDiscountPercent > 0;
      return {
        ...item,
        effectiveUnitPrice: applies ? pricing.unitPrice : item.price,
        effectiveLineTotal: applies ? pricing.lineTotal : item.lineTotal,
        wholesaleDiscountPercent: applies ? pricing.appliedDiscountPercent : 0,
      };
    });
  }, [cartItems, wholesalePricing, isWholesaleEligible]);

  const effectiveSubtotal = useMemo(
    () => effectiveCartItems.reduce((sum, item) => sum + item.effectiveLineTotal, 0),
    [effectiveCartItems]
  );

  const effectiveGrandTotal = useMemo(
    () => effectiveSubtotal + shippingCost,
    [effectiveSubtotal, shippingCost]
  );

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

      if (searchTerm.trim() && !product.name.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
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
  }, [categoryFilter, priceFilter, searchTerm, sortOption, productCatalog]);

  // Any change to what's being filtered/sorted/searched invalidates whatever
  // page the user was on — safest to just snap back to page 1 rather than
  // risk landing on a page past the new (smaller) result set.
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, priceFilter, searchTerm, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const pageNumbers = useMemo(() => {
    // Simple "1 2 3 ... last" style list — with ellipses collapsing the
    // middle once there are enough pages that showing all of them would be
    // more clutter than the pagination bar is worth.
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set([1, 2, totalPages - 1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const sorted = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

    const withEllipses = [];
    sorted.forEach((page, index) => {
      if (index > 0 && page - sorted[index - 1] > 1) {
        withEllipses.push('ellipsis');
      }
      withEllipses.push(page);
    });
    return withEllipses;
  }, [totalPages, currentPage]);

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
    const orderLines = effectiveCartItems.map(
      (item) =>
        `- ${item.name} (${item.size}) x ${item.quantity} = ${formatCurrency(item.effectiveLineTotal)}${item.wholesaleDiscountPercent > 0 ? ` (wholesale -${item.wholesaleDiscountPercent}%)` : ''}`
    );

    const body = [
      'Hello,',
      '',
      `I would like to place ${isWholesaleEligible ? 'a wholesale/bulk' : 'an'} order with the following products:`,
      '',
      ...orderLines,
      '',
      `Total Items: ${totalItems}`,
      `Subtotal: ${formatCurrency(effectiveSubtotal)}`,
      `Shipping (${deliveryZoneLabel}): ${formatCurrency(shippingCost)}`,
      `Grand Total: ${formatCurrency(effectiveGrandTotal)}`,
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
        subtotal: effectiveSubtotal,
        shipping_cost: shippingCost,
        grand_total: effectiveGrandTotal,
        notes: customerNotes.trim() || null,
        channel: isWholesaleEligible ? 'b2b' : 'retail',
      })
      .select('id')
      .single();

    if (orderError || !orderRow) {
      pushToast('error', 'Could not save your order. Please try again.');
      setIsSendingOrder(false);
      return;
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      effectiveCartItems.map((item) => ({
        order_id: orderRow.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.effectiveUnitPrice,
        line_total: item.effectiveLineTotal,
      }))
    );

    if (itemsError) {
      pushToast('error', 'Order saved, but item details failed to record. Our team will follow up with you directly.');
    } else {
      // Best-effort stock decrement — same "DB-first, this part can't sink
      // the order" spirit as the notification email below. Idempotent
      // server-side, so there's no real downside to firing it here even if
      // something upstream retries.
      decrementInventoryForOrder(orderRow.id).catch(() => {});
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
          subtotal: formatCurrency(effectiveSubtotal),
          shipping: formatCurrency(shippingCost),
          grand_total: formatCurrency(effectiveGrandTotal),
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
    clearCart();
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerNotes('');
    setDeliveryZone('');
    setDeliveryAddress('');
    setIsSendingOrder(false);
  };

  // Quotation Requests (§2.4): an alternative to placing an order outright —
  // Corporate Partner/admin only (enforced by RLS on the insert). Deliberately
  // reuses whatever's in the cart as the "custom product list" rather than
  // building a separate item picker from scratch, and deliberately doesn't
  // send price data — quotations.quoted_unit_price starts null and is filled
  // in by an admin later, so the retail/wholesale numbers in the cart aren't
  // relevant here, only product + quantity.
  const handleRequestQuote = async () => {
    if (cartItems.length === 0) {
      pushToast('error', 'Your cart is empty. Add at least one product before requesting a quote.');
      return;
    }

    if (isRequestingQuote) return;

    setIsRequestingQuote(true);
    try {
      await submitQuotation({
        items: cartItems.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
        })),
        customerNotes: customerNotes.trim() || null,
      });
      setShowQuoteSuccessPopup(true);
      pushToast('success', 'Quote request submitted.');
      clearCart();
      setCustomerNotes('');
    } catch {
      pushToast('error', 'Could not submit your quote request. Please try again.');
    } finally {
      setIsRequestingQuote(false);
    }
  };

  const cartProps = {
    cartItems: effectiveCartItems,
    totalItems,
    subtotal: effectiveSubtotal,
    shippingCost,
    deliveryZoneLabel,
    grandTotal: effectiveGrandTotal,
    isWholesaleEligible,
    onChangeQuantity: changeQuantity,
    onClearCart: clearCart,
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
    isRequestingQuote,
    onRequestQuote: handleRequestQuote,
  };

  const hasActiveFilters = categoryFilter !== 'all' || priceFilter !== 'all' || sortOption !== 'featured' || searchTerm.trim() !== '';

  const resetFilters = () => {
    setCategoryFilter('all');
    setPriceFilter('all');
    setSortOption('featured');
    setSearchTerm('');
  };

  return (
    <div className="pt-28 sm:pt-30 md:pt-32 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1320px] mx-auto">
        <div className="mb-6 sm:mb-8">
          <Typography variant="label" className="mb-2 block">Shop</Typography>
          <Typography variant="h2" className="text-foreground">All Products</Typography>
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
            <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
              <aside className="w-full lg:w-64 shrink-0 space-y-5">
                <div className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
                  <p className="mb-3 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary">Search Product</p>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
                  <p className="mb-3 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary">Product Categories</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[0.86rem] transition-colors ${categoryFilter === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-[var(--color-hover-overlay)]'}`}
                    >
                      <span>All Categories</span>
                      <span className="text-[0.76rem] text-muted-foreground">({productCatalog.length})</span>
                    </button>
                    {SHOP_CATEGORY_ORDER.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setCategoryFilter(category)}
                        className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[0.86rem] transition-colors ${categoryFilter === category ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-[var(--color-hover-overlay)]'}`}
                      >
                        <span>{category}</span>
                        <span className="text-[0.76rem] text-muted-foreground">({categoryCounts[category] || 0})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
                  <p className="mb-3 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary">Filter By Price</p>
                  <div className="space-y-1">
                    {PRICE_FILTERS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPriceFilter(option.value)}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[0.86rem] transition-colors ${priceFilter === option.value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-[var(--color-hover-overlay)]'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[0.8rem] font-semibold text-primary underline underline-offset-2"
                  >
                    Reset all filters
                  </button>
                )}
              </aside>

              <section className="flex-1 min-w-0 w-full">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border-light)] bg-white px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid view"
                      aria-pressed={viewMode === 'grid'}
                      className={`h-8 w-8 rounded-lg border inline-flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-medium)] text-muted-foreground hover:text-foreground'}`}
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      aria-label="List view"
                      aria-pressed={viewMode === 'list'}
                      className={`h-8 w-8 rounded-lg border inline-flex items-center justify-center transition-colors ${viewMode === 'list' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-medium)] text-muted-foreground hover:text-foreground'}`}
                    >
                      <List size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={sortOption}
                      onChange={(event) => setSortOption(event.target.value)}
                      className="rounded-lg border border-[var(--color-border-medium)] bg-white px-3 py-1.5 text-[0.82rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="featured">Sort by Featured</option>
                      <option value="price_low_to_high">Price: Low to High</option>
                      <option value="price_high_to_low">Price: High to Low</option>
                      <option value="name_a_to_z">Name: A to Z</option>
                      <option value="name_z_to_a">Name: Z to A</option>
                    </select>

                    {filteredProducts.length > 0 && (
                      <p className="text-[0.78rem] text-muted-foreground whitespace-nowrap">
                        Showing {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} results
                      </p>
                    )}
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--color-border-light)] bg-white px-5 py-10 text-center text-[0.95rem] text-muted-foreground">
                    No products match your current filters.
                  </div>
                ) : (
                  <>
                    <motion.div
                      key={`${categoryFilter}-${priceFilter}-${sortOption}-${searchTerm}-${currentPage}-${viewMode}`}
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4'
                          : 'flex flex-col gap-3'
                      }
                      variants={staggerContainer(0.05)}
                      initial="hidden"
                      animate="visible"
                    >
                      {paginatedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          category={getShopCategory(product)}
                          quantity={cart[product.id] || 0}
                          isWishlisted={wishlistIds.has(product.id)}
                          onAddToCart={addToCart}
                          onToggleWishlist={toggleWishlist}
                          onOpenDetail={setSelectedProduct}
                          view={viewMode}
                        />
                      ))}
                    </motion.div>

                    {totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          disabled={currentPage === 1}
                          aria-label="Previous page"
                          className="h-9 w-9 rounded-lg border border-[var(--color-border-medium)] inline-flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-hover-overlay)] transition-colors"
                        >
                          <ChevronLeft size={15} />
                        </button>

                        {pageNumbers.map((page, index) =>
                          page === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="px-1.5 text-[0.82rem] text-muted-foreground">…</span>
                          ) : (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              aria-current={currentPage === page ? 'page' : undefined}
                              className={`h-9 min-w-9 px-2.5 rounded-lg border text-[0.82rem] font-semibold transition-colors ${currentPage === page ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-medium)] text-foreground hover:bg-[var(--color-hover-overlay)]'}`}
                            >
                              {page}
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          disabled={currentPage === totalPages}
                          aria-label="Next page"
                          className="h-9 w-9 rounded-lg border border-[var(--color-border-medium)] inline-flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-hover-overlay)] transition-colors"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>

            <ShopCart {...cartProps} openSignal={cartOpenSignal} />
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

      {showQuoteSuccessPopup && (
        <div
          className="fixed inset-0 z-[95] bg-[rgba(13,20,16,0.58)] backdrop-blur-sm px-4 py-8 sm:px-6 sm:py-12"
          onClick={() => setShowQuoteSuccessPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Quote request confirmation"
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
                Quote Request Sent!
              </Typography>

              <p className="text-center text-[0.95rem] leading-relaxed text-muted-foreground mb-6">
                Our team will review your product list and get back to you with pricing. You can check
                the status any time from your account.
              </p>

              <div className="flex justify-center">
                <Button
                  className="px-6 py-2.5 text-[0.74rem]"
                  onClick={() => setShowQuoteSuccessPopup(false)}
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

      {bundlePopup && (
        <div
          className="fixed inset-0 z-[95] bg-[rgba(13,20,16,0.58)] backdrop-blur-sm px-4 py-8 sm:px-6 sm:py-12"
          onClick={() => setBundlePopup(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Bundle added to cart"
        >
          <div
            className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.96))] p-6 sm:p-7 shadow-[0_30px_80px_rgba(8,14,10,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/12 border border-primary/25 inline-flex items-center justify-center">
              <ShoppingBag size={28} className="text-primary" />
            </div>

            <Typography variant="h4" className="text-center text-foreground mb-1.5">
              {bundlePopup.bundleName} added to your cart
            </Typography>
            <p className="text-center text-[0.86rem] text-muted-foreground mb-5">
              {bundlePopup.items.length} products are ready — check out whenever you're set.
            </p>

            <div className="space-y-2 mb-6">
              {bundlePopup.items.map(({ product, quantity }) => {
                const image = PRODUCT_IMAGES[product.id] || product.image_url || null;
                return (
                  <div key={product.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border-light)] bg-white/70 px-3 py-2.5">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-[rgba(247,241,227,0.5)] shrink-0">
                      {image ? (
                        <img src={image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-text-tertiary">
                          <ImageOff size={12} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.82rem] font-semibold text-foreground truncate">{product.name}</p>
                    </div>
                    {quantity > 1 && <span className="text-[0.76rem] text-muted-foreground shrink-0">x{quantity}</span>}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-2.5">
              <Button
                icon={ShoppingBag}
                className="px-6 py-2.5 text-[0.74rem]"
                onClick={() => {
                  setBundlePopup(null);
                  setCartOpenSignal(Date.now());
                }}
              >
                Checkout Now
              </Button>
              <Button
                variant="ghost"
                className="px-6 py-2.5 text-[0.74rem]"
                onClick={() => setBundlePopup(null)}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
