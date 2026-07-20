import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ImageOff, Plus, X } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { shopPathForBrand } from '../../lib/brands';

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

export const ProductDetailModal = ({ product, category, isWishlisted, onClose, onToggleWishlist, onAddToCart }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!product) return null;

  const hasSale = Boolean(product.compare_at_price) && Number(product.compare_at_price) > Number(product.price);

  return (
    <div
      className="fixed inset-0 z-[80] bg-[rgba(17,24,20,0.5)] backdrop-blur-sm px-4 py-6 sm:px-6 sm:py-10 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} details`}
    >
      <div
        className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white shadow-[0_24px_60px_rgba(8,14,10,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 sm:px-6 border-b border-[var(--color-border-light)]">
          <div>
            <p className="text-[0.64rem] font-bold tracking-[0.16em] uppercase text-accent mb-1.5">{category}</p>
            <Typography variant="h4" className="text-foreground text-balance">{product.name}</Typography>
            {product.size && <p className="mt-1 text-[0.8rem] text-muted-foreground">{product.size}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`h-9 w-9 rounded-full border inline-flex items-center justify-center transition-colors ${isWishlisted ? 'border-red-200 bg-red-50 text-red-600' : 'border-[var(--color-border-medium)] text-foreground hover:text-red-600'}`}
            >
              <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-full border border-[var(--color-border-medium)] text-foreground inline-flex items-center justify-center hover:bg-[var(--color-hover-overlay)] transition-colors"
              aria-label="Close product details"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="rounded-xl border border-[var(--color-border-light)] bg-[rgba(247,241,227,0.4)] overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.name} className="block w-full h-full object-cover" />
            ) : (
              <div className="aspect-square w-full flex items-center justify-center text-text-tertiary">
                <ImageOff size={36} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <p className="font-display text-[1.6rem] leading-none text-primary">{formatCurrency(product.price)}</p>
              {hasSale && (
                <>
                  <p className="text-[1rem] text-text-tertiary line-through">{formatCurrency(product.compare_at_price)}</p>
                  <span className="rounded-md border border-[var(--color-border-medium)] bg-[var(--color-card-bg)] px-2 py-1 text-[0.62rem] font-bold tracking-[0.12em] uppercase text-foreground">
                    Sale
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <div>
                <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1">Overview</p>
                <p className="text-[0.9rem] leading-relaxed text-muted-foreground">{product.description}</p>
              </div>
            )}

            {product.ingredients && (
              <div>
                <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1">Key Ingredients</p>
                <p className="text-[0.88rem] leading-relaxed text-muted-foreground">{product.ingredients}</p>
              </div>
            )}

            {product.benefits && (
              <div>
                <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1">Benefits</p>
                <p className="text-[0.88rem] leading-relaxed text-muted-foreground">{product.benefits}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Button
                className="w-full sm:w-auto px-6 py-2.5 text-[0.76rem]"
                icon={Plus}
                onClick={() => {
                  onAddToCart(product.id);
                  onClose();
                }}
              >
                Add To Cart
              </Button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`${shopPathForBrand(product.brand)}/${product.id}`);
                }}
                className="text-[0.8rem] font-semibold text-primary underline underline-offset-2"
              >
                View Full Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
