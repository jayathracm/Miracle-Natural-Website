import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { Check, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { BundleDetailModal } from './BundleDetailModal';
import { fetchBundles } from '../lib/bundles';
import { staggerContainer, fadeUpItem, viewportOnce } from '../lib/motionVariants';
import { shopPathForBrand } from '../lib/brands';

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

const PricingSection = () => {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetchBundles()
      .then((rows) => {
        if (isMounted) setBundles(rows);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Could not load bundles.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Hands the bundle's real products off to the Shop page, which adds them
  // straight to the cart on arrival and shows a confirmation with a
  // checkout shortcut — no re-fetching, the items are already in hand here.
  const handleBuyBundle = (bundle) => {
    setSelectedBundle(null);
    navigate(shopPathForBrand('miracle_natural'), {
      state: {
        bundlePurchase: {
          bundleName: bundle.name,
          items: bundle.items.map(({ product, quantity }) => ({ product, quantity })),
        },
      },
    });
  };

  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 md:mb-20">
          <Typography variant="label" className="mb-4 block">Shop Bundles</Typography>
          <Typography variant="h2" className="mb-6 text-foreground">
            Pick your Miracle Natural <br />
            <span className="text-primary">care routine bundle</span>
          </Typography>
          <Typography variant="p" className="max-w-2xl mx-auto">
            Start simple or go all-in. Each bundle is curated to make your routine effective and easy to follow.
          </Typography>
        </div>

        {error ? (
          <p className="text-center text-[0.9rem] text-red-700">{error}</p>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-[var(--color-card-border)] p-6 md:p-7 space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6"
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {bundles.map((bundle) => (
              <motion.div
                key={bundle.id}
                variants={fadeUpItem}
                className={`rounded-xl border p-6 md:p-7 ${bundle.featured
                  ? 'border-primary shadow-[0_20px_45px_rgba(31,44,35,0.14)] bg-[rgba(255,250,239,0.95)]'
                  : 'border-[var(--color-card-border)] bg-[rgba(255,252,245,0.88)]'
                  }`}
              >
                <Typography variant="h3" className="text-foreground mb-2">{bundle.name}</Typography>
                <p className="text-[2rem] font-display text-primary mb-3">{formatCurrency(bundle.price)}</p>
                <Typography variant="small" className="text-muted-foreground mb-6 block">{bundle.description}</Typography>

                <ul className="space-y-3 mb-7">
                  {bundle.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-foreground/80 text-[0.9rem]">
                      <span className="p-1 rounded-full bg-primary/15 text-primary mt-0.5"><Check size={12} /></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => setSelectedBundle(bundle)}
                >
                  Choose Bundle
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 md:gap-7 mt-12 sm:mt-14 md:mt-16"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <motion.div variants={fadeUpItem} className="p-5 rounded-lg bg-[rgba(255,252,245,0.82)] border border-primary/10 text-center">
            <Leaf className="mx-auto mb-3 text-primary" size={20} />
            <Typography variant="h4" className="mb-2">Plant-led formulas</Typography>
            <Typography variant="small">Botanical ingredients selected for daily comfort.</Typography>
          </motion.div>
          <motion.div variants={fadeUpItem} className="p-5 rounded-lg bg-[rgba(255,252,245,0.82)] border border-primary/10 text-center">
            <ShieldCheck className="mx-auto mb-3 text-primary" size={20} />
            <Typography variant="h4" className="mb-2">No hidden extras</Typography>
            <Typography variant="small">Simple prices with clear bundle contents.</Typography>
          </motion.div>
          <motion.div variants={fadeUpItem} className="p-5 rounded-lg bg-[rgba(255,252,245,0.82)] border border-primary/10 text-center">
            <Sparkles className="mx-auto mb-3 text-primary" size={20} />
            <Typography variant="h4" className="mb-2">Routine guidance</Typography>
            <Typography variant="small">Every order includes practical usage instructions.</Typography>
          </motion.div>
        </motion.div>
      </div>

      {selectedBundle && (
        <BundleDetailModal
          bundle={selectedBundle}
          onClose={() => setSelectedBundle(null)}
          onBuy={handleBuyBundle}
        />
      )}
    </section>
  );
};

export default PricingSection;
