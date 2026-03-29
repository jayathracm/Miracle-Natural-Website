import React from 'react';
import { Check, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';

const bundleCards = [
  {
    title: 'Glow Starter Bundle',
    price: 'LKR 8,900',
    description: 'Cleanser, hydrating toner, daily moisturizer',
    points: ['Gentle daily essentials', 'Best for first-time routines', 'AM + PM guide included'],
  },
  {
    title: 'Repair & Renew Bundle',
    price: 'LKR 12,500',
    description: 'Serum trio, recovery cream, overnight support',
    points: ['Targets dullness and texture', 'Supports skin barrier repair', 'Most popular choice'],
    featured: true,
  },
  {
    title: 'Complete Ritual Bundle',
    price: 'LKR 16,900',
    description: 'Face, body, and hair full-care selection',
    points: ['Head-to-toe personal care', 'Seasonal routine planner', 'Best total value'],
  },
];

const PricingSection = () => {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {bundleCards.map((bundle) => (
            <div
              key={bundle.title}
              className={`rounded-xl border p-6 md:p-7 transition-all duration-300 ${bundle.featured
                ? 'border-primary shadow-[0_20px_45px_rgba(31,44,35,0.14)] bg-[rgba(255,250,239,0.95)]'
                : 'border-[var(--color-card-border)] bg-[rgba(255,252,245,0.88)]'
                }`}
            >
              <Typography variant="h3" className="text-foreground mb-2">{bundle.title}</Typography>
              <p className="text-[2rem] font-display text-primary mb-3">{bundle.price}</p>
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
                onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Choose Bundle
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 md:gap-7 mt-12 sm:mt-14 md:mt-16">
          <div className="p-5 rounded-lg bg-[rgba(255,252,245,0.82)] border border-primary/10 text-center">
            <Leaf className="mx-auto mb-3 text-primary" size={20} />
            <Typography variant="h4" className="mb-2">Plant-led formulas</Typography>
            <Typography variant="small">Botanical ingredients selected for daily comfort.</Typography>
          </div>
          <div className="p-5 rounded-lg bg-[rgba(255,252,245,0.82)] border border-primary/10 text-center">
            <ShieldCheck className="mx-auto mb-3 text-primary" size={20} />
            <Typography variant="h4" className="mb-2">No hidden extras</Typography>
            <Typography variant="small">Simple prices with clear bundle contents.</Typography>
          </div>
          <div className="p-5 rounded-lg bg-[rgba(255,252,245,0.82)] border border-primary/10 text-center">
            <Sparkles className="mx-auto mb-3 text-primary" size={20} />
            <Typography variant="h4" className="mb-2">Routine guidance</Typography>
            <Typography variant="small">Every order includes practical usage instructions.</Typography>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
