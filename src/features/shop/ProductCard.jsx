import React, { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>, <motion.button>)
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Heart, ImageOff, Leaf, ShoppingBag, Star } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { TiltCard } from '@/shared/ui/TiltCard';
import { fadeUpItem } from '@/shared/lib/motionVariants';
import { formatCurrency } from '@/shared/lib/currency';
import { computeUnitPrice } from '@/features/shop/unitPricing';

// Stronger than TiltCard's default (max 7 / scale 1.02) — this card is the
// primary hover target on the shop grid, so it earns a more pronounced lift.
const CARD_TILT_OPTIONS = { max: 8, scale: 1.03 };

// A single product tile: image, wishlist heart, name/size/price, add-to-cart.
// `view` switches between the grid tile and a horizontal list row — same
// data and handlers, just a different layout.
export const ProductCard = ({ product, category, quantity, isWishlisted, onAddToCart, onToggleWishlist, onOpenDetail, view = 'grid' }) => {
  const hasSale = Boolean(product.compare_at_price) && Number(product.compare_at_price) > Number(product.price);
  const isOutOfStock = Boolean(product.is_out_of_stock);
  const ratingCount = product.ratingCount || 0;
  const unitPrice = computeUnitPrice(product.size, Number(product.price));
  // First ingredient only — ingredients is a free-text comma list, and one
  // highlighted term ("Manjishta", "Aloe Vera"...) reads as a trust pill
  // without trying to parse marketing claims out of prose.
  const keyIngredient = product.ingredients?.split(',')[0]?.trim();

  // Brief checkmark swap after adding — the quantity badge alone is easy to
  // miss, this gives the click a moment of visible confirmation.
  const [justAdded, setJustAdded] = useState(false);
  useEffect(() => {
    if (!justAdded) return undefined;
    const timeoutId = window.setTimeout(() => setJustAdded(false), 900);
    return () => window.clearTimeout(timeoutId);
  }, [justAdded]);

  // Priority-ordered badge stack, capped at 2 so the corner never gets
  // crowded. Out of stock overrides everything else — a sale or "new" tag
  // on something you can't buy is just confusing.
  const badges = isOutOfStock
    ? [{ key: 'out-of-stock', label: 'Out of Stock', className: 'border-gray-400 bg-white/95 text-gray-700' }]
    : [
        hasSale && { key: 'sale', label: 'Sale', className: 'border-[var(--color-border-medium)] bg-[var(--color-card-bg)]/95 text-foreground' },
        product.isNew && { key: 'new', label: 'New', className: 'border-primary/40 bg-primary/10 text-primary' },
        product.isLowStock && { key: 'low-stock', label: 'Low Stock', className: 'border-amber-300 bg-amber-50 text-amber-800' },
      ].filter(Boolean).slice(0, 2);

  const badgeStack = badges.length > 0 && (
    <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`rounded-md border backdrop-blur-sm px-2 py-1 text-[0.6rem] font-bold tracking-[0.12em] uppercase shadow-sm ${badge.className}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );

  const wishlistButton = (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggleWishlist(product.id);
      }}
      aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      className={`absolute top-2 right-2 z-10 h-7 w-7 rounded-full inline-flex items-center justify-center backdrop-blur-sm transition-colors ${isWishlisted ? 'bg-white/95 text-red-600' : 'bg-white/70 text-foreground/70 hover:text-red-600 hover:bg-white/95'}`}
    >
      <Heart size={13} fill={isWishlisted ? 'currentColor' : 'none'} />
    </button>
  );

  const ratingRow = ratingCount > 0 && (
    <div className="flex items-center gap-1 mb-1">
      <Star size={11} className="fill-primary text-primary" />
      <span className="text-[0.72rem] font-semibold text-text-secondary">{product.ratingAverage.toFixed(1)}</span>
      <span className="text-[0.68rem] text-text-tertiary">({ratingCount})</span>
    </div>
  );

  const ingredientPill = keyIngredient && (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-light)] bg-[rgba(247,241,227,0.6)] px-2 py-0.5 text-[0.6rem] font-semibold text-text-secondary">
      <Leaf size={9} className="text-primary" />
      {keyIngredient}
    </span>
  );

  const priceLine = (
    <div>
      <div className="flex items-baseline gap-2">
        <p className="font-display text-[1.15rem] text-primary">{formatCurrency(product.price)}</p>
        {hasSale && (
          <p className="text-[0.8rem] text-text-tertiary line-through">{formatCurrency(product.compare_at_price)}</p>
        )}
      </div>
      {unitPrice && (
        <p className="text-[0.66rem] text-text-tertiary">
          {formatCurrency(unitPrice.pricePer100, { maximumFractionDigits: 0 })}/{unitPrice.unitLabel}
        </p>
      )}
    </div>
  );

  const addToCartButton = isOutOfStock ? (
    <span
      aria-label={`${product.name} is out of stock`}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-gray-200 text-gray-400 px-3.5 py-2 text-[0.72rem] font-bold uppercase tracking-[0.04em] cursor-not-allowed"
    >
      Out of Stock
    </span>
  ) : (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={(event) => {
        event.stopPropagation();
        onAddToCart(product.id);
        setJustAdded(true);
      }}
      aria-label={`Add ${product.name} to cart`}
      className="relative shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary text-white pl-3 pr-3.5 py-2 text-[0.72rem] font-bold uppercase tracking-[0.04em] shadow-[0_6px_14px_rgba(79,113,84,0.35)] hover:bg-forest-800 hover:shadow-[0_8px_18px_rgba(79,113,84,0.45)] transition-[background-color,box-shadow]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={justAdded ? 'check' : 'bag'}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="inline-flex items-center gap-1.5"
        >
          {justAdded ? <Check size={14} /> : <ShoppingBag size={14} />}
          {justAdded ? '' : '+'}
        </motion.span>
      </AnimatePresence>
      {quantity > 0 && (
        <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-accent text-white text-[0.6rem] font-bold flex items-center justify-center">
          {quantity}
        </span>
      )}
    </motion.button>
  );

  const image = product.image ? (
    <img
      src={product.image}
      alt={product.name}
      className={`h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.03] ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
      loading="lazy"
    />
  ) : (
    <div className="h-full w-full flex items-center justify-center text-text-tertiary">
      <ImageOff size={24} />
    </div>
  );

  const sharedProps = {
    as: 'article',
    onClick: () => onOpenDetail(product),
    role: 'button',
    tabIndex: 0,
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenDetail(product);
      }
    },
    tiltOptions: CARD_TILT_OPTIONS,
  };

  if (view === 'list') {
    return (
      <motion.div variants={fadeUpItem}>
        <TiltCard
          {...sharedProps}
          className="group flex items-stretch gap-4 rounded-xl border border-[var(--color-border-light)] bg-white overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-[0_16px_32px_rgba(31,44,35,0.14)] p-3 sm:p-3.5"
        >
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-lg bg-[rgba(247,241,227,0.5)] overflow-hidden">
            {image}
            {badgeStack}
          </div>

          <div className="flex flex-1 min-w-0 flex-col justify-center gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[0.62rem] font-bold tracking-[0.13em] uppercase text-accent">{category}</p>
              {ingredientPill}
            </div>
            <Typography variant="h4" className="text-foreground text-[0.94rem] leading-snug line-clamp-1">{product.name}</Typography>
            {product.size && <p className="text-[0.78rem] text-muted-foreground">{product.size}</p>}
            {ratingRow}
            {priceLine}
          </div>

          <div className="flex flex-col items-end justify-between shrink-0 py-0.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleWishlist(product.id);
              }}
              aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
              className={`h-7 w-7 rounded-full inline-flex items-center justify-center transition-colors ${isWishlisted ? 'bg-red-50 text-red-600' : 'bg-[rgba(247,241,227,0.6)] text-foreground/70 hover:text-red-600'}`}
            >
              <Heart size={13} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            {addToCartButton}
          </div>
        </TiltCard>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUpItem} className="h-full">
      <TiltCard
        {...sharedProps}
        className="group h-full flex flex-col rounded-xl border border-[var(--color-border-light)] bg-white overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-[0_16px_32px_rgba(31,44,35,0.14)]"
      >
        <div className="relative aspect-square bg-[rgba(247,241,227,0.5)] overflow-hidden">
          {image}
          {badgeStack}
          {wishlistButton}
        </div>

        <div className="p-3 sm:p-3.5 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <p className="text-[0.62rem] font-bold tracking-[0.13em] uppercase text-accent truncate">{category}</p>
            {ingredientPill}
          </div>
          <Typography variant="h4" className="text-foreground text-[0.92rem] leading-snug mb-1 line-clamp-2">{product.name}</Typography>
          {ratingRow}

          <div className="mt-auto flex items-end justify-between gap-2">
            {priceLine}
            {addToCartButton}
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
};
