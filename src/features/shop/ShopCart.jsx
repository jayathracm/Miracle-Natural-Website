import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>, <motion.button>)
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronLeft, ImageOff, Mail, Minus, Percent, Plus, ShoppingBag, Truck, X } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import DELIVERY_ZONES from '@/features/addresses/deliveryZones';
import { formatCurrency } from '@/shared/lib/currency';

// Shared by the desktop sidebar and mobile drawer so they never drift out
// of sync. Switches between "cart" and "checkout" views via mode state.
const CartInner = ({
  mode,
  setMode,
  showCloseButton,
  onRequestClose,
  cartItems,
  totalItems,
  subtotal,
  shippingCost,
  deliveryZoneLabel,
  grandTotal,
  isWholesaleEligible,
  moqViolations = [],
  onChangeQuantity,
  onClearCart,
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
  onSelectSavedAddress,
  isSendingOrder,
  onSubmitOrder,
  paymentMethod,
  setPaymentMethod,
  paymentUiState,
  paymentErrorMessage,
  onCheckPaymentAgain,
  isRequestingQuote,
  onRequestQuote,
}) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-[var(--color-border-light)]">
      {mode === 'checkout' && (
        <button
          type="button"
          onClick={() => setMode('cart')}
          aria-label="Back to cart"
          className="h-7 w-7 rounded-full inline-flex items-center justify-center hover:bg-[var(--color-hover-overlay)] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      )}
      <Typography variant="h4" className="text-foreground text-[0.98rem] flex-1">
        {mode === 'checkout' ? 'Checkout' : 'Your Cart'}
      </Typography>
      {mode === 'cart' && totalItems > 0 && (
        <span className="text-[0.74rem] font-semibold text-muted-foreground">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
      )}
      {mode === 'cart' && cartItems.length > 0 && (
        <button
          type="button"
          onClick={onClearCart}
          className="text-[0.72rem] font-semibold text-muted-foreground underline underline-offset-2 hover:text-red-600 transition-colors"
        >
          Clear
        </button>
      )}
      {showCloseButton && (
        <button
          type="button"
          onClick={onRequestClose}
          aria-label="Close cart"
          className="h-7 w-7 rounded-full inline-flex items-center justify-center hover:bg-[var(--color-hover-overlay)] transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>

    {mode === 'cart' ? (
      <div className="p-4 sm:p-5">
        {cartItems.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingBag className="mx-auto mb-3 text-text-tertiary" size={26} />
            <p className="text-[0.86rem] text-muted-foreground">Your cart is empty.</p>
          </div>
        ) : (
          <>
            {isWholesaleEligible && cartItems.some((item) => item.wholesaleDiscountPercent > 0) && (
              <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2 text-[0.74rem] font-semibold text-primary">
                <Percent size={13} />
                Wholesale pricing applied to eligible items
              </div>
            )}
            {moqViolations.length > 0 && (
              <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[0.74rem] text-amber-800">
                <p className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle size={13} />
                  Minimum order quantity not met
                </p>
                {moqViolations.map(({ item, pricing }) => (
                  <p key={item.id} className="mt-0.5 pl-[19px] text-[0.72rem] opacity-90">
                    {item.name}: need {pricing.moq}, have {item.quantity}
                  </p>
                ))}
              </div>
            )}
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 -mr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-[rgba(247,241,227,0.5)] shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-contain object-center" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-text-tertiary">
                        <ImageOff size={13} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] font-semibold text-foreground truncate">{item.name}</p>
                    {item.wholesaleDiscountPercent > 0 ? (
                      <p className="text-[0.72rem] text-muted-foreground flex items-center gap-1.5">
                        <span className="line-through text-text-tertiary">{formatCurrency(item.price)}</span>
                        <span className="font-semibold text-primary">{formatCurrency(item.effectiveUnitPrice)} each</span>
                        <span className="rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-bold text-primary">
                          -{item.wholesaleDiscountPercent}%
                        </span>
                      </p>
                    ) : (
                      <p className="text-[0.72rem] text-muted-foreground">{formatCurrency(item.price)} each</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onChangeQuantity(item.id, -1)}
                      aria-label={`Decrease quantity for ${item.name}`}
                      className="h-6 w-6 rounded-md border border-[var(--color-border-medium)] text-foreground inline-flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-[0.8rem] font-semibold w-4 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onChangeQuantity(item.id, 1)}
                      aria-label={`Increase quantity for ${item.name}`}
                      className="h-6 w-6 rounded-md border border-[var(--color-border-medium)] text-foreground inline-flex items-center justify-center"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3.5 border-t border-[var(--color-border-light)] space-y-1.5">
              <div className="flex items-center justify-between text-[0.8rem]">
                <span className="text-muted-foreground">Items Subtotal</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[0.8rem]">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold text-foreground">{deliveryZoneLabel ? formatCurrency(shippingCost) : 'Calculated at checkout'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-[var(--color-border-light)]">
                <span className="text-[0.9rem] font-semibold text-foreground">Total</span>
                <span className="font-display text-[1.3rem] text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-4 py-2.5 text-[0.76rem]"
              onClick={() => setMode('checkout')}
              disabled={moqViolations.length > 0}
            >
              {moqViolations.length > 0 ? 'Adjust Quantities to Continue' : 'Checkout'}
            </Button>
          </>
        )}
      </div>
    ) : paymentUiState === 'confirming' ? (
      <div className="p-4 sm:p-5 py-14 flex flex-col items-center justify-center gap-3 text-center">
        <div className="h-9 w-9 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
        <Typography variant="h4" className="text-foreground text-[0.92rem]">
          Confirming your payment…
        </Typography>
        <p className="text-[0.76rem] text-muted-foreground max-w-[230px]">
          This usually takes a few seconds. Please don&rsquo;t close this window.
        </p>
      </div>
    ) : (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitOrder();
        }}
        className="p-4 sm:p-5 space-y-3"
      >
        <div className="rounded-lg bg-[rgba(247,241,227,0.45)] px-3 py-2.5 flex items-center justify-between">
          <span className="text-[0.8rem] text-muted-foreground">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          <span className="font-display text-[1.1rem] text-primary">{formatCurrency(grandTotal)}</span>
        </div>

        <Input type="text" placeholder="Your Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <Input type="text" placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        <Input type="email" placeholder="Your Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />

        {user && savedAddresses.length > 0 && (
          <select
            value={selectedAddressId}
            onChange={(e) => onSelectSavedAddress(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white px-3 py-2.5 text-[0.86rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="manual">Enter a different address</option>
            {savedAddresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label} — {DELIVERY_ZONES[address.delivery_zone]?.label || address.delivery_zone}
              </option>
            ))}
          </select>
        )}

        <select
          value={deliveryZone}
          onChange={(e) => {
            setDeliveryZone(e.target.value);
            onSelectSavedAddress('manual');
          }}
          className="w-full rounded-lg border border-[var(--color-border-medium)] bg-white px-3 py-2.5 text-[0.86rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select Delivery Zone</option>
          <option value="colombo_1_15">Colombo 1-15</option>
          <option value="island_wide">Other Areas in Sri Lanka</option>
        </select>

        <Textarea
          placeholder="Delivery Address"
          rows={2}
          value={deliveryAddress}
          onChange={(e) => {
            setDeliveryAddress(e.target.value);
            onSelectSavedAddress('manual');
          }}
        />

        {user && (
          <Link to="/account?tab=addresses" className="inline-block text-[0.72rem] font-semibold text-primary underline underline-offset-2">
            Manage saved addresses
          </Link>
        )}

        <Textarea
          placeholder="Notes (optional)"
          rows={2}
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('cash_on_delivery')}
            className={`rounded-lg border px-3 py-2.5 text-[0.76rem] font-semibold tracking-[0.01em] transition-colors ${
              paymentMethod === 'cash_on_delivery'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-[var(--color-border-medium)] bg-white/85 text-muted-foreground'
            }`}
          >
            Cash on Delivery
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('payhere')}
            className={`rounded-lg border px-3 py-2.5 text-[0.76rem] font-semibold tracking-[0.01em] transition-colors ${
              paymentMethod === 'payhere'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-[var(--color-border-medium)] bg-white/85 text-muted-foreground'
            }`}
          >
            Pay Online
          </button>
        </div>

        <p className="flex items-center gap-1.5 text-[0.74rem] text-muted-foreground">
          <Truck size={13} />
          {paymentMethod === 'payhere'
            ? "Secure card payment via PayHere — you'll complete payment in a popup before your order is confirmed."
            : 'Pay in cash when your order arrives.'}
        </p>

        {paymentUiState === 'failed' && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[0.74rem] text-red-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle size={13} />
              Payment unsuccessful
            </p>
            <p className="mt-0.5 pl-[19px] text-[0.72rem] opacity-90">
              {paymentErrorMessage || 'Your payment did not go through. Please try again.'}
            </p>
          </div>
        )}

        {paymentUiState === 'timeout' && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[0.74rem] text-amber-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle size={13} />
              Still confirming your payment
            </p>
            <p className="mt-0.5 pl-[19px] text-[0.72rem] opacity-90">
              This is taking longer than usual. If you completed the payment, tap below to check again.
            </p>
            <button
              type="button"
              onClick={onCheckPaymentAgain}
              className="mt-1.5 ml-[19px] text-[0.72rem] font-semibold text-primary underline underline-offset-2"
            >
              Check Again
            </button>
          </div>
        )}

        {moqViolations.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[0.74rem] text-amber-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle size={13} />
              Adjust quantities before placing this order
            </p>
            {moqViolations.map(({ item, pricing }) => (
              <p key={item.id} className="mt-0.5 pl-[19px] text-[0.72rem] opacity-90">
                {item.name}: need {pricing.moq}, have {item.quantity}
              </p>
            ))}
          </div>
        )}

        <Button
          type="submit"
          className="w-full py-2.5 text-[0.76rem]"
          icon={Mail}
          disabled={isSendingOrder || paymentUiState === 'awaiting_payment' || moqViolations.length > 0}
        >
          {paymentUiState === 'awaiting_payment'
            ? 'Complete Payment in Popup…'
            : isSendingOrder
            ? 'Placing Order...'
            : paymentMethod === 'payhere'
            ? 'Pay & Place Order'
            : 'Place Order'}
        </Button>

        {isWholesaleEligible && (
          <button
            type="button"
            disabled={isRequestingQuote}
            onClick={onRequestQuote}
            className="w-full py-2.5 rounded-lg border border-primary/40 text-[0.76rem] font-semibold tracking-[0.06em] uppercase text-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
          >
            {isRequestingQuote ? 'Submitting...' : 'Request a Quote Instead'}
          </button>
        )}
      </form>
    )}
  </div>
);

// Floating cart button (FAB on desktop, bottom bar on mobile) that opens a
// drawer with CartInner — slide-in panel on desktop, slide-up sheet on
// mobile, sharing the same isOpen/mode state.
export const ShopCart = (props) => {
  const { cartItems, totalItems, grandTotal, openSignal } = props;
  const [mode, setMode] = useState('cart');
  const [isOpen, setIsOpen] = useState(false);

  // Lets a parent force the drawer open by passing a changing value (e.g. a timestamp).
  useEffect(() => {
    if (openSignal) setIsOpen(true);
  }, [openSignal]);

  // Back to the cart view when it empties out, without auto-closing the
  // panel (closing made "Clear" look like nothing happened).
  useEffect(() => {
    if (cartItems.length === 0) {
      setMode('cart');
    }
  }, [cartItems.length]);

  return (
    <>
      {!isOpen && (
        <>
          {/* Desktop FAB. Sits at bottom-24 so it stacks above ChatWidget's bubble. */}
          <motion.button
            key={`fab-${totalItems}`}
            type="button"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => setIsOpen(true)}
            aria-label={totalItems > 0 ? `Open cart, ${totalItems} items` : 'Open cart'}
            className="hidden lg:flex fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full bg-primary text-white items-center justify-center shadow-[0_14px_32px_rgba(31,44,35,0.32)] hover:bg-forest-800 transition-colors"
          >
            <ShoppingBag size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-6 min-w-6 px-1 rounded-full bg-accent text-white text-[0.72rem] font-bold flex items-center justify-center ring-2 ring-[#f7f1e3]">
                {totalItems}
              </span>
            )}
          </motion.button>

          {/* Mobile bottom bar, only shown once the cart has items. */}
          {cartItems.length > 0 && (
            <motion.button
              key={`bar-${totalItems}`}
              type="button"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => setIsOpen(true)}
              className="lg:hidden fixed bottom-4 left-4 right-4 z-40 rounded-2xl bg-primary text-white shadow-[0_14px_32px_rgba(31,44,35,0.3)] px-4 py-3.5 flex items-center justify-between"
            >
              <span className="flex items-center gap-2 text-[0.86rem] font-semibold">
                <ShoppingBag size={16} />
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
              <span className="font-display text-[1.1rem]">{formatCurrency(grandTotal)}</span>
            </motion.button>
          )}
        </>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            <div
              className="absolute inset-0 bg-[rgba(17,24,20,0.5)] backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Desktop: slide-in panel from the right edge. Both this and the
                mobile sheet below are always mounted (only CSS toggles which
                one shows), so tests scope queries to this testid rather than
                matching the same content twice. */}
            <motion.div
              data-testid="cart-panel-desktop"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block absolute top-0 right-0 bottom-0 w-[400px] max-w-[92vw] bg-white overflow-y-auto shadow-[0_0_60px_rgba(8,14,10,0.25)]"
            >
              <CartInner {...props} mode={mode} setMode={setMode} showCloseButton onRequestClose={() => setIsOpen(false)} />
            </motion.div>

            {/* Mobile: slide-up sheet from the bottom. */}
            <motion.div
              data-testid="cart-panel-mobile"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden absolute bottom-0 inset-x-0 max-h-[88vh] rounded-t-2xl bg-white overflow-y-auto"
            >
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="h-1 w-10 rounded-full bg-[var(--color-border-medium)]" />
              </div>
              <CartInner {...props} mode={mode} setMode={setMode} showCloseButton onRequestClose={() => setIsOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
