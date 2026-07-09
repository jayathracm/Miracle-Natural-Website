import React from 'react';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { Heart, ImageOff, Plus } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { TiltCard } from '../ui/TiltCard';
import { fadeUpItem } from '../../lib/motionVariants';

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

// A single, clean product tile: image, wishlist heart, name/size/price, and
// a quick add-to-cart button. Deliberately spare — no gradients, no stacked
// borders, no per-category chrome — so a page of these reads as one calm
// grid instead of a wall of competing boxes.
//
// `view` switches between the grid tile (default) and a horizontal list row
// — same data, same handlers, just a different layout for the Shop page's
// grid/list toggle.
export const ProductCard = ({ product, category, quantity, isWishlisted, onAddToCart, onToggleWishlist, onOpenDetail, view = 'grid' }) => {
  const hasSale = Boolean(product.compare_at_price) && Number(product.compare_at_price) > Number(product.price);

  const wishlistButton = (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggleWishlist(product.id);
      }}
      aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      className={`absolute top-2 right-2 h-7 w-7 rounded-full inline-flex items-center justify-center backdrop-blur-sm transition-colors ${isWishlisted ? 'bg-white/95 text-red-600' : 'bg-white/70 text-foreground/70 hover:text-red-600 hover:bg-white/95'}`}
    >
      <Heart size={13} fill={isWishlisted ? 'currentColor' : 'none'} />
    </button>
  );

  const saleBadge = hasSale && (
    <span className="absolute top-2 left-2 rounded-md border border-[var(--color-border-medium)] bg-[var(--color-card-bg)]/95 backdrop-blur-sm px-2 py-1 text-[0.6rem] font-bold tracking-[0.12em] uppercase text-foreground shadow-sm">
      Sale
    </span>
  );

  const priceLine = (
    <div className="flex items-baseline gap-2">
      <p className="font-display text-[1.15rem] text-primary">{formatCurrency(product.price)}</p>
      {hasSale && (
        <p className="text-[0.8rem] text-text-tertiary line-through">{formatCurrency(product.compare_at_price)}</p>
      )}
    </div>
  );

  const addToCartButton = (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onAddToCart(product.id);
      }}
      aria-label={`Add ${product.name} to cart`}
      className="relative shrink-0 h-8 w-8 rounded-full bg-primary text-white inline-flex items-center justify-center hover:bg-forest-800 transition-colors"
    >
      <Plus size={15} />
      {quantity > 0 && (
        <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-accent text-white text-[0.6rem] font-bold flex items-center justify-center">
          {quantity}
        </span>
      )}
    </button>
  );

  const image = product.image ? (
    <img
      src={product.image}
      alt={product.name}
      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
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
  };

  if (view === 'list') {
    return (
      <motion.div variants={fadeUpItem}>
        <TiltCard
          {...sharedProps}
          className="group flex items-stretch gap-4 rounded-xl border border-[var(--color-border-light)] bg-white overflow-hidden cursor-pointer transition-shadow hover:shadow-[0_10px_24px_rgba(31,44,35,0.1)] p-3 sm:p-3.5"
        >
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-lg bg-[rgba(247,241,227,0.5)] overflow-hidden">
            {image}
            {saleBadge}
          </div>

          <div className="flex flex-1 min-w-0 flex-col justify-center gap-1.5">
            <p className="text-[0.62rem] font-bold tracking-[0.13em] uppercase text-accent">{category}</p>
            <Typography variant="h4" className="text-foreground text-[0.94rem] leading-snug line-clamp-1">{product.name}</Typography>
            {product.size && <p className="text-[0.78rem] text-muted-foreground">{product.size}</p>}
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
        className="group h-full flex flex-col rounded-xl border border-[var(--color-border-light)] bg-white overflow-hidden cursor-pointer transition-shadow hover:shadow-[0_10px_24px_rgba(31,44,35,0.1)]"
      >
        <div className="relative aspect-square bg-[rgba(247,241,227,0.5)] overflow-hidden">
          {image}
          {saleBadge}
          {wishlistButton}
        </div>

        <div className="p-3 sm:p-3.5 flex flex-col flex-1">
          <p className="text-[0.62rem] font-bold tracking-[0.13em] uppercase text-accent mb-1">{category}</p>
          <Typography variant="h4" className="text-foreground text-[0.92rem] leading-snug mb-2 line-clamp-2">{product.name}</Typography>

          <div className="mt-auto flex items-center justify-between gap-2">
            {priceLine}
            {addToCartButton}
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
};
