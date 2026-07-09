import React, { useEffect, useState } from 'react';
import { Percent, TrendingUp } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { calculateB2BPrice, fetchDiscountTiers } from '../../lib/b2bPricing';

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

// Only ever rendered for a signed-in corporate_partner/admin — calculate_b2b_price
// itself would happily return a valid retail-priced response for anyone else
// (is_eligible: false), but there's no reason to call it or show this panel to
// a plain customer, so the parent gates on role before mounting this.
export const WholesalePricingPanel = ({ productId, quantity }) => {
  const [pricing, setPricing] = useState(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState(null);
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    fetchDiscountTiers()
      .then((data) => setTiers(data.filter((tier) => tier.is_active)))
      .catch(() => {
        // Reference-only ladder — if it fails to load, the live calculation
        // below still works fine on its own.
      });
  }, []);

  useEffect(() => {
    if (!productId || !quantity || quantity < 1) return undefined;

    setIsLoadingPricing(true);
    setPricingError(null);

    // Small debounce so rapid +/- clicks on the quantity stepper don't fire
    // a request per click.
    const timeoutId = setTimeout(() => {
      calculateB2BPrice(productId, quantity)
        .then(setPricing)
        .catch((error) => setPricingError(error.message || 'Could not calculate wholesale pricing.'))
        .finally(() => setIsLoadingPricing(false));
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [productId, quantity]);

  const remainingForNextTier =
    pricing?.nextTierMinQuantity != null ? pricing.nextTierMinQuantity - quantity : null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] px-4 py-4 sm:px-5 sm:py-5 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Percent size={15} className="text-primary" />
        <Typography variant="label" className="text-primary">Wholesale Pricing</Typography>
      </div>

      {pricingError ? (
        <p className="text-[0.82rem] text-red-600">{pricingError}</p>
      ) : isLoadingPricing && !pricing ? (
        <p className="text-[0.82rem] text-muted-foreground">Calculating...</p>
      ) : pricing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div>
              <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary">
                Unit Price
              </p>
              <p className="font-display text-[1.3rem] text-primary">
                {formatCurrency(pricing.unitPrice)}
                {pricing.appliedDiscountPercent > 0 && (
                  <span className="ml-2 align-middle rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[0.62rem] font-bold tracking-[0.08em] uppercase text-primary">
                    -{pricing.appliedDiscountPercent}%
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary">
                Line Total ({pricing.requestedQuantity} units)
              </p>
              <p className="text-[1rem] font-semibold text-foreground">{formatCurrency(pricing.lineTotal)}</p>
            </div>
          </div>

          {!pricing.meetsMoq && (
            <p className="text-[0.8rem] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              This product's minimum order quantity for wholesale pricing is{' '}
              <strong>{pricing.moq} units</strong> — showing retail pricing until then.
            </p>
          )}

          {pricing.meetsMoq && remainingForNextTier > 0 && (
            <p className="flex items-center gap-1.5 text-[0.8rem] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <TrendingUp size={14} className="shrink-0" />
              Order <strong>{remainingForNextTier} more unit{remainingForNextTier === 1 ? '' : 's'}</strong> to
              unlock <strong>{pricing.nextTierDiscountPercent}% off</strong>.
            </p>
          )}

          {tiers.length > 0 && (
            <div>
              <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">
                Volume Discounts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tiers.map((tier) => {
                  const isCurrentTier =
                    pricing.meetsMoq && tier.discount_percent === pricing.appliedDiscountPercent;
                  return (
                    <span
                      key={tier.id}
                      className={`rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold ${
                        isCurrentTier
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[var(--color-border-medium)] bg-white/70 text-text-secondary'
                      }`}
                    >
                      {tier.min_quantity}+ → {tier.discount_percent}%
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default WholesalePricingPanel;
