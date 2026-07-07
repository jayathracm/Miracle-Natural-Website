import React, { useEffect } from 'react';
import { ImageOff, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import PRODUCT_IMAGES from '../data/productImages';

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

export const BundleDetailModal = ({ bundle, onClose, onBuy }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!bundle) return null;

  const individualTotal = bundle.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const savings = individualTotal - bundle.price;
  const usageSteps = (bundle.usageGuide || '').split('\n').filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[80] bg-[rgba(17,24,20,0.5)] backdrop-blur-sm px-4 py-6 sm:px-6 sm:py-10 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${bundle.name} details`}
    >
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white shadow-[0_24px_60px_rgba(8,14,10,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 sm:px-6 border-b border-[var(--color-border-light)]">
          <div>
            <Typography variant="label" className="mb-1.5 block">Bundle</Typography>
            <Typography variant="h4" className="text-foreground text-balance">{bundle.name}</Typography>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 shrink-0 rounded-full border border-[var(--color-border-medium)] text-foreground inline-flex items-center justify-center hover:bg-[var(--color-hover-overlay)] transition-colors"
            aria-label="Close bundle details"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[rgba(247,241,227,0.5)] px-4 py-3.5">
            <div>
              <p className="font-display text-[1.6rem] leading-none text-primary">{formatCurrency(bundle.price)}</p>
              {savings > 0 && (
                <p className="mt-1 text-[0.76rem] text-muted-foreground">
                  {formatCurrency(individualTotal)} bought separately — you save {formatCurrency(savings)}
                </p>
              )}
            </div>
            <Button icon={ShoppingBag} className="px-5 py-2.5 text-[0.74rem] shrink-0" onClick={() => onBuy(bundle)}>
              Buy This Bundle
            </Button>
          </div>

          <div>
            <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-2.5">
              What's Included ({bundle.items.length})
            </p>
            <div className="space-y-2.5">
              {bundle.items.map(({ product, quantity }) => {
                const image = PRODUCT_IMAGES[product.id] || product.image_url || null;
                return (
                  <div key={product.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-border-light)] px-3 py-2.5">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-[rgba(247,241,227,0.5)] shrink-0">
                      {image ? (
                        <img src={image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-text-tertiary">
                          <ImageOff size={13} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.86rem] font-semibold text-foreground truncate">{product.name}</p>
                      <p className="text-[0.74rem] text-muted-foreground">{product.size}{quantity > 1 ? ` · Qty ${quantity}` : ''}</p>
                    </div>
                    <p className="text-[0.82rem] font-semibold text-foreground shrink-0">{formatCurrency(product.price)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {usageSteps.length > 0 && (
            <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3.5">
              <p className="flex items-center gap-1.5 text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-primary mb-2">
                <Sparkles size={12} /> How To Use
              </p>
              <div className="space-y-1.5">
                {usageSteps.map((step) => (
                  <p key={step} className="text-[0.86rem] leading-relaxed text-foreground/85">{step}</p>
                ))}
              </div>
            </div>
          )}

          <Button icon={ShoppingBag} className="w-full py-2.5 text-[0.76rem]" onClick={() => onBuy(bundle)}>
            Buy This Bundle
          </Button>
        </div>
      </div>
    </div>
  );
};
