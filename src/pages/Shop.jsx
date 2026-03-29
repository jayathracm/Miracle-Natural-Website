import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mail, Minus, Plus, ShoppingCart, Sparkles, Trash2, X } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import productCatalog from '../data/productCatalog';

const ORDER_EMAIL = import.meta.env.VITE_ORDER_EMAIL || 'jayathracm@gmail.com';

const formatCurrency = (amount) => `LKR ${amount.toLocaleString('en-LK')}`;

const DELIVERY_ZONES = {
  colombo_1_15: { label: 'Colombo 1-15', rate: 300 },
  island_wide: { label: 'Other Areas in Sri Lanka', rate: 350 },
};

const ShopPage = () => {
  const [cart, setCart] = useState({});
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
  }, [cart]);

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

  const clearCart = () => setCart({});

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

  useEffect(() => {
    if (!selectedProduct) return undefined;

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setSelectedProduct(null);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedProduct]);

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

    try {
      setIsSendingOrder(true);

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

      setShowOrderSuccessPopup(true);
      pushToast('success', 'Order sent successfully.');
      setCart({});
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerNotes('');
      setDeliveryZone('');
      setDeliveryAddress('');
    } catch {
      pushToast('error', 'Could not send automatically. Please try again or use WhatsApp ordering.');
    } finally {
      setIsSendingOrder(false);
    }
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1320px] mx-auto">
        <div className="mb-8 sm:mb-10 md:mb-12 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 md:px-10 md:py-9 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Shop All Products</Typography>
          <Typography variant="h2" className="mb-4 text-foreground text-balance">
            Build your cart and order directly by email
          </Typography>
          <Typography variant="p" className="max-w-3xl">
            Browse the full Miracle Natural collection, add products to your cart, and send your order list directly by email.
          </Typography>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">14+ Products</span>
            <span className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">Fast Email Checkout</span>
            <span className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">Secure Direct Ordering</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_0.95fr] gap-8 lg:gap-10">
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {productCatalog.map((product) => {
                const quantity = cart[product.id] || 0;

                return (
                  <article
                    key={product.id}
                    className="group rounded-2xl overflow-hidden border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_12px_28px_rgba(31,44,35,0.08)] hover:shadow-[0_18px_36px_rgba(31,44,35,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedProduct(product);
                      }
                    }}
                  >
                    <div className="aspect-[4/5] bg-[rgba(255,251,243,0.9)] overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      <p className="text-[0.68rem] font-bold tracking-[0.16em] uppercase text-accent mb-2">{product.category}</p>
                      <Typography variant="h4" className="text-foreground mb-1 leading-snug">{product.name}</Typography>
                      <Typography variant="small" className="block mb-3">{product.size}</Typography>

                      <div className="flex items-center justify-between mb-4 rounded-lg border border-[var(--color-border-light)] bg-white/65 px-3 py-2">
                        <p className="font-display text-[1.45rem] text-primary">{formatCurrency(product.price)}</p>
                        {quantity > 0 && (
                          <p className="text-[0.8rem] font-semibold text-foreground">In Cart: {quantity}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-auto">
                        <Button
                          className="flex-1 px-3 py-2 text-[0.74rem]"
                          onClick={(event) => {
                            event.stopPropagation();
                            addToCart(product.id);
                          }}
                          icon={Plus}
                        >
                          Add To Cart
                        </Button>
                        {quantity > 0 && (
                          <Button
                            variant="ghost"
                            className="px-3 py-2 text-[0.74rem]"
                            onClick={(event) => {
                              event.stopPropagation();
                              changeQuantity(product.id, -1);
                            }}
                            aria-label={`Remove one ${product.name}`}
                          >
                            <Minus size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto h-fit rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(180deg,rgba(255,251,242,0.94),rgba(248,243,232,0.9))] p-5 sm:p-6 shadow-[0_18px_34px_rgba(31,44,35,0.12)] backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h4" className="text-foreground">Your Cart</Typography>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                <ShoppingCart size={14} className="text-primary" />
                <span className="text-[0.75rem] font-semibold text-primary">{totalItems} items</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[260px] sm:max-h-[320px] lg:max-h-[34vh] overflow-auto pr-1 mb-5">
              {cartItems.length === 0 ? (
                <p className="text-[0.9rem] text-muted-foreground">No products added yet.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--color-border-light)] bg-white/75 p-3">
                    <p className="text-[0.88rem] font-semibold text-foreground">{item.name}</p>
                    <p className="text-[0.75rem] text-muted-foreground mb-2">{item.size}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, -1)}
                          className="h-7 w-7 rounded-md border border-[var(--color-border-medium)] text-foreground inline-flex items-center justify-center"
                          aria-label={`Decrease quantity for ${item.name}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-[0.82rem] font-semibold min-w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, 1)}
                          className="h-7 w-7 rounded-md border border-[var(--color-border-medium)] text-foreground inline-flex items-center justify-center"
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-[0.82rem] font-semibold text-primary">{formatCurrency(item.lineTotal)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 mb-5">
              <input
                type="text"
                placeholder="Your Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="email"
                placeholder="Your Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <select
                value={deliveryZone}
                onChange={(e) => setDeliveryZone(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Delivery Zone</option>
                <option value="colombo_1_15">Colombo 1-15</option>
                <option value="island_wide">Other Areas in Sri Lanka</option>
              </select>
              <textarea
                placeholder="Delivery Address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <textarea
                placeholder="Notes (optional)"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="rounded-xl border border-[var(--color-border-light)] bg-white/60 p-3 mb-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[0.83rem] text-muted-foreground">Subtotal</p>
                  <p className="text-[0.92rem] font-semibold text-foreground">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[0.83rem] text-muted-foreground">Shipping</p>
                  <p className="text-[0.92rem] font-semibold text-foreground">{deliveryZone ? formatCurrency(shippingCost) : 'Select zone'}</p>
                </div>
                <div className="h-px bg-[var(--color-border-light)] my-1.5" />
                <div className="flex items-center justify-between">
                  <p className="text-[0.85rem] text-muted-foreground">Grand Total</p>
                  <p className="font-display text-[1.4rem] text-foreground">{formatCurrency(grandTotal)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <Button
                className="w-full px-4 py-2.5 text-[0.76rem]"
                icon={Mail}
                onClick={handleEmailOrder}
                disabled={isSendingOrder}
              >
                {isSendingOrder ? 'Sending Order...' : 'Send Order Email'}
              </Button>
              <Button
                variant="ghost"
                className="w-full px-4 py-2.5 text-[0.76rem]"
                icon={Trash2}
                onClick={clearCart}
                disabled={cartItems.length === 0}
              >
                Clear Cart
              </Button>
            </div>

          </aside>
        </div>
      </div>

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[110] flex w-[min(92vw,390px)] flex-col-reverse gap-2.5">
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
            <div className="pointer-events-none absolute bottom-8 right-8 text-secondary/70">
              <Sparkles size={14} />
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
        <div
          className="fixed inset-0 z-[80] bg-[rgba(17,24,20,0.55)] backdrop-blur-sm px-4 py-6 sm:px-6 sm:py-10 overflow-y-auto"
          onClick={() => setSelectedProduct(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedProduct.name} details`}
        >
          <div
            className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(249,244,233,0.97))] shadow-[0_34px_80px_rgba(8,14,10,0.34)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-[var(--color-card-border)] px-5 py-4 sm:px-7 sm:py-6">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,rgba(189,150,79,0.9),rgba(109,131,88,0.85),rgba(189,150,79,0.9))]" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.66rem] font-bold tracking-[0.18em] uppercase text-accent mb-2">{selectedProduct.category}</p>
                  <Typography variant="h4" className="text-foreground text-balance">{selectedProduct.name}</Typography>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/80 px-2.5 py-1 text-[0.66rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">
                      {selectedProduct.size}
                    </span>
                    <span className="inline-flex rounded-full border border-[var(--color-border-light)] bg-white/80 px-2.5 py-1 text-[0.66rem] font-semibold tracking-[0.08em] uppercase text-text-secondary">
                      Catalog Page {selectedProduct.sourcePage ?? 'N/A'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="h-10 w-10 rounded-xl border border-[var(--color-border-medium)] bg-white/85 text-foreground inline-flex items-center justify-center transition-colors hover:bg-white"
                  aria-label="Close product details"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[0.96fr_1.04fr] gap-5 px-5 py-5 sm:px-7 sm:py-7">
              <div className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(165deg,rgba(255,255,255,0.92),rgba(251,247,238,0.8))] p-4 shadow-[0_14px_28px_rgba(31,44,35,0.08)]">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="h-72 w-full object-contain"
                />
                <p className="mt-3 text-center text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-text-secondary">
                  Authentic Catalog Visual
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--color-border-light)] bg-white/75 px-4 py-3.5 shadow-[0_10px_24px_rgba(31,44,35,0.06)]">
                  <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1">Price</p>
                  <p className="font-display text-[1.7rem] leading-none text-primary">{formatCurrency(selectedProduct.price)}</p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border-light)] bg-white/65 px-4 py-3.5">
                  <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Overview</p>
                  <p className="text-[0.92rem] leading-relaxed text-muted-foreground">{selectedProduct.description || 'Product details available in catalog.'}</p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border-light)] bg-white/65 px-4 py-3.5">
                  <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Key Ingredients</p>
                  <p className="text-[0.9rem] leading-relaxed text-muted-foreground">{selectedProduct.ingredients || 'Refer to product catalog for ingredient details.'}</p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border-light)] bg-white/65 px-4 py-3.5">
                  <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Benefits</p>
                  <p className="text-[0.9rem] leading-relaxed text-muted-foreground">{selectedProduct.benefits || 'Refer to product catalog for benefits and usage guidance.'}</p>
                </div>

                <Button
                  className="w-full sm:w-auto px-5 py-2.5 text-[0.74rem] rounded-xl"
                  icon={Plus}
                  onClick={() => {
                    addToCart(selectedProduct.id);
                    setSelectedProduct(null);
                  }}
                >
                  Add To Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
