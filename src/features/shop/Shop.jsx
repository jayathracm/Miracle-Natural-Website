import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, LayoutGrid, List, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { Input } from '@/shared/ui/Input';
import { Typography } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { ProductGridSkeleton, Skeleton } from '@/shared/ui/Skeleton';
import { ProductCard } from '@/features/shop/ProductCard';
import { ProductDetailModal } from '@/features/shop/ProductDetailModal';
import { ShopCart } from '@/features/shop/ShopCart';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/features/auth/AuthContext';
import { useBrandCart } from '@/features/shop/CartContext';
import { useWishlist } from '@/features/wishlist/useWishlist';
import DELIVERY_ZONES from '@/features/addresses/deliveryZones';
import { fetchAddresses } from '@/features/addresses/addresses';
import { calculateB2BPrice } from '@/features/b2b/b2bPricing';
import { decrementInventoryForOrder } from '@/features/inventory/inventory';
import { submitQuotation } from '@/features/quotations/quotations';
import { staggerContainer } from '@/shared/lib/motionVariants';
import { SHOP_CATEGORY_ORDER, getShopCategory } from '@/features/shop/shopCategories';
import { BRAND_BY_SLUG } from '@/shared/lib/brands';
import NotFound from '@/shared/NotFound';
import {
  computeEffectiveCartItems,
  computeMoqViolations,
  computeEffectiveSubtotal,
  computeEffectiveGrandTotal,
} from '@/features/shop/cartPricing';
import { formatCurrency } from '@/shared/lib/currency';

const ORDER_EMAIL = import.meta.env.VITE_ORDER_EMAIL || 'dinisha@lanmic.com';
const PRODUCTS_PER_PAGE = 12;

// Live merchant account — flip back to true only for local/sandbox testing.
const PAYHERE_SANDBOX = false;
const PAYHERE_POLL_INTERVAL_MS = 2000;
const PAYHERE_POLL_MAX_ATTEMPTS = 15; // ~30s total

const PRICE_FILTERS = [
  { value: 'all', label: 'All Prices' },
  { value: 'under_500', label: 'Under LKR 500' },
  { value: '500_1500', label: 'LKR 500 - 1,500' },
  { value: '1501_3000', label: 'LKR 1,501 - 3,000' },
  { value: 'above_3000', label: 'Above LKR 3,000' },
];

// Used by both the desktop sidebar and the mobile filter drawer so the
// search/category/price controls only exist in one place.
const ShopFilters = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  totalCount,
  categoryCounts,
  priceFilter,
  onPriceChange,
  hasActiveFilters,
  onResetFilters,
}) => (
  <>
    <div className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
      <p className="mb-3 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary">Search Product</p>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-8"
        />
      </div>
    </div>

    <div className="rounded-xl border border-[var(--color-border-light)] bg-white p-4">
      <p className="mb-3 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary">Product Categories</p>
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[0.86rem] transition-colors ${categoryFilter === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-[var(--color-hover-overlay)]'}`}
        >
          <span>All Categories</span>
          <span className="text-[0.76rem] text-muted-foreground">({totalCount})</span>
        </button>
        {SHOP_CATEGORY_ORDER.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
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
            onClick={() => onPriceChange(option.value)}
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
        onClick={onResetFilters}
        className="text-[0.8rem] font-semibold text-primary underline underline-offset-2"
      >
        Reset all filters
      </button>
    )}
  </>
);

const ShopPage = () => {
  const { brandSlug } = useParams();
  const brandEntry = BRAND_BY_SLUG[brandSlug];
  const brand = brandEntry?.brand;

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
    changeQuantity,
    clearCart,
  } = useBrandCart(brand);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [showOrderSuccessPopup, setShowOrderSuccessPopup] = useState(false);
  // Online payment state: 'idle' | 'awaiting_payment' | 'confirming' | 'failed' | 'timeout'.
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [paymentUiState, setPaymentUiState] = useState('idle');
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState(null);
  const [lastPaidWithPayHere, setLastPaidWithPayHere] = useState(false);
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  const [showQuoteSuccessPopup, setShowQuoteSuccessPopup] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortOption, setSortOption] = useState('featured');
  // Seeds from ?q= so external links (e.g. the homepage "new release" CTA)
  // can land directly on a filtered search instead of the full catalog.
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(location.search).get('q') || '');
  const [viewMode, setViewMode] = useState('grid');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('manual');
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

  // Handles ProductDetail's "View Cart" (openCart) opening the cart drawer
  // on arrival, then clears the nav state so a refresh doesn't reopen it.
  useEffect(() => {
    const state = location.state;
    if (!state) return;

    if (state.openCart) {
      setCartOpenSignal(Date.now());
    }

    navigate(location.pathname, { replace: true, state: null });
    // Only ever meant to run for the navigation that carried this state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Load PayHere's checkout SDK up front so the popup opens instantly on
  // submit instead of waiting on a script fetch. Safe to call every mount.
  useEffect(() => {
    if (window.payhere || document.getElementById('payhere-js-sdk')) return;
    const script = document.createElement('script');
    script.id = 'payhere-js-sdk';
    script.src = 'https://www.payhere.lk/lib/payhere.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

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

  // Corporate Partner carts get wholesale tier pricing per line item,
  // same math as the product page. Debounced so quick +/- clicks don't
  // fire a request per click. Kept local to this page — nothing else
  // reads cartItems, so prices shown elsewhere stay retail.
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

  const effectiveCartItems = useMemo(
    () => computeEffectiveCartItems(cartItems, wholesalePricing, isWholesaleEligible),
    [cartItems, wholesalePricing, isWholesaleEligible]
  );

  // Blocks checkout on MOQ violations for wholesale carts. Only flags a
  // line once its pricing has loaded, so a still-loading line doesn't
  // trigger a false block.
  const moqViolations = useMemo(
    () => computeMoqViolations(cartItems, wholesalePricing, isWholesaleEligible),
    [isWholesaleEligible, cartItems, wholesalePricing]
  );

  const effectiveSubtotal = useMemo(
    () => computeEffectiveSubtotal(effectiveCartItems),
    [effectiveCartItems]
  );

  const effectiveGrandTotal = useMemo(
    () => computeEffectiveGrandTotal(effectiveSubtotal, shippingCost),
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

  // Reset to page 1 whenever the filters/search/sort change.
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, priceFilter, searchTerm, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const pageNumbers = useMemo(() => {
    // "1 2 3 ... last" style list, collapsing the middle with ellipses.
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
    if (moqViolations.length > 0) {
      const summary = moqViolations
        .map(({ item, pricing }) => `${item.name} (needs ${pricing.moq}, have ${item.quantity})`)
        .join('; ');
      pushToast(
        'error',
        `Increase quantity to meet the minimum order quantity before placing a wholesale order: ${summary}.`
      );
      return;
    }

    if (isSendingOrder) return;

    const subject = `New ${brandEntry.label} Order - ${customerName || 'Customer'}`;
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
        brand,
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
      // Best-effort — order is already saved either way.
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
      // Non-fatal — order's already saved, admins will still see it.
    }

    // Best-effort customer confirmation email — a hiccup here shouldn't
    // block the success screen, the order is already saved regardless.
    supabase.functions.invoke('send-order-email', { body: { orderId: orderRow.id } }).catch(() => {});

    setLastPaidWithPayHere(false);
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

  // Resets the online-payment flow — used after success, and as a manual
  // "try again" after a failed/timed-out attempt.
  const resetPaymentFlow = () => {
    setPaymentUiState('idle');
    setPaymentOrderId(null);
    setPaymentErrorMessage(null);
  };

  // Polls payment_status until it leaves 'pending' or hits the attempt cap.
  // This decides the success screen, not payhere.onCompleted — that only
  // means the popup closed, not that the payment was verified.
  const pollPaymentStatus = (orderId, attempt = 1) => {
    window.setTimeout(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single();

      if (error || !data) {
        if (attempt < PAYHERE_POLL_MAX_ATTEMPTS) {
          pollPaymentStatus(orderId, attempt + 1);
        } else {
          setPaymentUiState('timeout');
        }
        return;
      }

      if (data.payment_status === 'paid') {
        setLastPaidWithPayHere(true);
        setShowOrderSuccessPopup(true);
        pushToast('success', 'Payment confirmed — order placed successfully.');
        clearCart();
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setCustomerNotes('');
        setDeliveryZone('');
        setDeliveryAddress('');
        resetPaymentFlow();
        return;
      }

      if (['failed', 'cancelled', 'chargedback'].includes(data.payment_status)) {
        setPaymentUiState('failed');
        setPaymentErrorMessage('Your payment did not go through. You can try again below, or switch to Cash on Delivery.');
        return;
      }

      // Still 'pending' — keep polling until the cap.
      if (attempt < PAYHERE_POLL_MAX_ATTEMPTS) {
        pollPaymentStatus(orderId, attempt + 1);
      } else {
        setPaymentUiState('timeout');
      }
    }, PAYHERE_POLL_INTERVAL_MS);
  };

  // Mirrors handleEmailOrder's validation and order insert, deliberately
  // duplicated so the working COD path can't be affected by changes here.
  // Unlike COD, this doesn't decrement stock or email — that happens
  // server-side in payhere-notify, only once payment is verified.
  const handlePayHereOrder = async () => {
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
    if (moqViolations.length > 0) {
      const summary = moqViolations
        .map(({ item, pricing }) => `${item.name} (needs ${pricing.moq}, have ${item.quantity})`)
        .join('; ');
      pushToast(
        'error',
        `Increase quantity to meet the minimum order quantity before placing a wholesale order: ${summary}.`
      );
      return;
    }
    if (!window.payhere) {
      pushToast('error', 'Online payment is still loading — please try again in a moment.');
      return;
    }

    if (isSendingOrder) return;
    setIsSendingOrder(true);
    setPaymentErrorMessage(null);

    try {
      let orderId = paymentOrderId;

      // Retrying after a failed/cancelled payment reuses the same order
      // instead of creating a duplicate.
      if (!orderId) {
        const { data: orderRow, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user?.id ?? null,
            customer_name: customerName.trim(),
            customer_email: customerEmail.trim(),
            customer_phone: customerPhone.trim(),
            payment_method: 'payhere',
            payment_status: 'pending',
            delivery_zone: deliveryZone,
            delivery_address: deliveryAddress.trim(),
            subtotal: effectiveSubtotal,
            shipping_cost: shippingCost,
            grand_total: effectiveGrandTotal,
            notes: customerNotes.trim() || null,
            channel: isWholesaleEligible ? 'b2b' : 'retail',
            brand,
          })
          .select('id')
          .single();

        if (orderError || !orderRow) {
          pushToast('error', 'Could not start your order. Please try again.');
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
          pushToast('error', 'Could not save your order items. Please try again.');
          setIsSendingOrder(false);
          return;
        }

        orderId = orderRow.id;
        setPaymentOrderId(orderId);
      }

      const { data: initiateData, error: initiateError } = await supabase.functions.invoke('payhere-initiate', {
        body: { orderId },
      });

      if (initiateError || initiateData?.error) {
        pushToast('error', initiateData?.error || 'Could not start online payment. Please try again.');
        setIsSendingOrder(false);
        return;
      }

      setIsSendingOrder(false);
      setPaymentUiState('awaiting_payment');

      window.payhere.onCompleted = function onCompleted() {
        // Popup finished — doesn't mean payment succeeded. Poll for the real result.
        setPaymentUiState('confirming');
        pollPaymentStatus(orderId);
      };

      window.payhere.onDismissed = function onDismissed() {
        // Closed without paying — order stays pending, they can retry.
        setPaymentUiState('idle');
      };

      window.payhere.onError = function onError(error) {
        setPaymentUiState('failed');
        setPaymentErrorMessage(typeof error === 'string' ? error : 'Something went wrong starting the payment.');
      };

      window.payhere.startPayment({
        sandbox: PAYHERE_SANDBOX,
        merchant_id: initiateData.merchantId,
        return_url: undefined,
        cancel_url: undefined,
        notify_url: initiateData.notifyUrl,
        order_id: initiateData.orderId,
        items: initiateData.items,
        amount: initiateData.amount,
        currency: initiateData.currency,
        hash: initiateData.hash,
        first_name: initiateData.customer.firstName,
        last_name: initiateData.customer.lastName,
        email: initiateData.customer.email,
        phone: initiateData.customer.phone,
        address: initiateData.customer.address,
        city: initiateData.customer.city,
        country: initiateData.customer.country,
      });
    } catch {
      setIsSendingOrder(false);
      pushToast('error', 'Could not start online payment. Please try again.');
    }
  };

  const handleSubmitOrder = () => {
    if (paymentMethod === 'payhere') {
      handlePayHereOrder();
    } else {
      handleEmailOrder();
    }
  };

  // Alternative to placing an order — Corporate Partner/admin only (RLS
  // enforced). Reuses the cart as the product list, no price sent since an
  // admin fills in quoted pricing later.
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
    moqViolations,
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
    onSubmitOrder: handleSubmitOrder,
    paymentMethod,
    setPaymentMethod,
    paymentUiState,
    paymentErrorMessage,
    onCheckPaymentAgain: () => {
      if (paymentOrderId) {
        setPaymentUiState('confirming');
        pollPaymentStatus(paymentOrderId);
      }
    },
    lastPaidWithPayHere,
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

  // Invalid brand in the URL — safe to bail here since all hooks above
  // handle an undefined brand fine.
  if (!brandEntry) {
    return <NotFound />;
  }

  return (
    <div className="pt-28 sm:pt-30 md:pt-32 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1320px] mx-auto">
        <div className="mb-6 sm:mb-8">
          <Typography variant="label" className="mb-2 block">Shop</Typography>
          <Typography variant="h2" className="text-foreground">{brandEntry.label}</Typography>
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
        ) : productCatalog.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-light)] bg-white px-5 py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/12 border border-primary/25 inline-flex items-center justify-center">
              <Clock size={26} className="text-primary" />
            </div>
            <Typography variant="h4" className="text-foreground mb-2">{brandEntry.label} Shop Coming Soon</Typography>
            <p className="text-[0.9rem] text-muted-foreground mb-5 max-w-md mx-auto">
              There's nothing to browse here just yet — check back soon, or shop Miracle Natural in the meantime.
            </p>
            <Button onClick={() => navigate('/miracle-natural/shop')}>Shop Miracle Natural</Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
              <aside className="hidden lg:block lg:w-64 shrink-0 space-y-5">
                <ShopFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  categoryFilter={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  totalCount={productCatalog.length}
                  categoryCounts={categoryCounts}
                  priceFilter={priceFilter}
                  onPriceChange={setPriceFilter}
                  hasActiveFilters={hasActiveFilters}
                  onResetFilters={resetFilters}
                />
              </aside>

              <section className="flex-1 min-w-0 w-full">
                {/* Mobile: filters collapsed behind this toggle, opens the drawer below. */}
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden mb-4 w-full flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border-light)] bg-white px-4 py-3 text-[0.86rem] font-semibold text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={15} className="text-primary" />
                    Filters
                    {hasActiveFilters && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-[0.76rem] font-normal text-muted-foreground">
                    {filteredProducts.length} results
                  </span>
                </button>

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

      {isMobileFiltersOpen && (
        <div
          className="fixed inset-0 z-[95] bg-[rgba(13,20,16,0.58)] backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileFiltersOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.96))] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(8,14,10,0.3)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-border-medium)]" />
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h4" className="text-foreground">Filters</Typography>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="h-8 w-8 rounded-full inline-flex items-center justify-center hover:bg-[var(--color-hover-overlay)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5">
              <ShopFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                totalCount={productCatalog.length}
                categoryCounts={categoryCounts}
                priceFilter={priceFilter}
                onPriceChange={setPriceFilter}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={resetFilters}
              />
            </div>

            <Button
              className="mt-5 w-full justify-center px-6 py-2.5 text-[0.74rem]"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              Show {filteredProducts.length} Results
            </Button>
          </div>
        </div>
      )}

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
                {lastPaidWithPayHere
                  ? 'Your payment was successful and your order is confirmed. A confirmation has been sent to your email.'
                  : "Your order was sent successfully. A team member will get back to you once the order is confirmed via email."}
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
    </div>
  );
};

export default ShopPage;
