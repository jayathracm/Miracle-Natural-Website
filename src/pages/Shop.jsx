import React, { useMemo, useState } from 'react';
import { Mail, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import productCatalog from '../data/productCatalog';

const ORDER_EMAIL = import.meta.env.VITE_ORDER_EMAIL || 'your-email@example.com';

const formatCurrency = (amount) => `LKR ${amount.toLocaleString('en-LK')}`;

const ShopPage = () => {
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

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

  const handleEmailOrder = () => {
    if (cartItems.length === 0) return;

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
      `Total Amount: ${formatCurrency(totalAmount)}`,
      '',
      'Customer Details:',
      `Name: ${customerName || 'Not provided'}`,
      `Phone: ${customerPhone || 'Not provided'}`,
      `Notes: ${customerNotes || 'None'}`,
      '',
      `Order Date: ${new Date().toLocaleString()}`,
    ].join('\n');

    window.location.href = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
                    className="group rounded-2xl overflow-hidden border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_12px_28px_rgba(31,44,35,0.08)] hover:shadow-[0_18px_36px_rgba(31,44,35,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
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
                          onClick={() => addToCart(product.id)}
                          icon={Plus}
                        >
                          Add To Cart
                        </Button>
                        {quantity > 0 && (
                          <Button
                            variant="ghost"
                            className="px-3 py-2 text-[0.74rem]"
                            onClick={() => changeQuantity(product.id, -1)}
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
              <textarea
                placeholder="Notes (optional)"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="rounded-xl border border-[var(--color-border-light)] bg-white/60 p-3 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-[0.85rem] text-muted-foreground">Total</p>
                <p className="font-display text-[1.4rem] text-foreground">{formatCurrency(totalAmount)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <Button
                className="w-full px-4 py-2.5 text-[0.76rem]"
                icon={Mail}
                onClick={handleEmailOrder}
                disabled={cartItems.length === 0}
              >
                Send Order Email
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

            <p className="mt-4 text-[0.72rem] text-muted-foreground leading-relaxed">
              Orders are sent via your default email app. To set your recipient, configure VITE_ORDER_EMAIL in your environment.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
