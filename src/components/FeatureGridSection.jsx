import React from 'react';
import { Leaf, ShieldCheck, Sparkles, FlaskConical, Droplets, Moon, Heart } from 'lucide-react';
import { Typography } from './ui/Typography';

const businessServices = [
  {
    icon: Leaf,
    title: 'Salon & Spa Bulk Products',
    desc: 'Bulk shampoos, conditioners, masks, cleansers, and men’s grooming products with refill plans.',
  },
  {
    icon: ShieldCheck,
    title: 'Raw Material Bulk Supply',
    desc: 'Bases for soap, shampoo, conditioner, cream, and scrub with B2B volume support.',
  },
  {
    icon: Sparkles,
    title: 'Contract Manufacturing',
    desc: 'OEM and private label support from formulation to filling and labeling with flexible MOQs.',
  },
  {
    icon: FlaskConical,
    title: 'Hospitality Packs',
    desc: 'Travel-size hotel bundles with custom branding and monthly refill options.',
  },
];

const consumerPicks = [
  {
    icon: Droplets,
    title: 'Golden Glow Face Wash',
    desc: 'Deep cleanse, removes dead cells, and supports natural-looking glow.',
  },
  {
    icon: Moon,
    title: 'Golden Glow Night Cream',
    desc: 'Overnight moisture support for smoother and more even-looking skin.',
  },
  {
    icon: Heart,
    title: 'Acne Treatment Gel',
    desc: 'Tea Tree and Neem formula to calm blemish-prone skin and reduce excess oil.',
  },
];

const FeatureGridSection = () => {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-14">
          <Typography variant="label" className="mb-4 block">What We Offer</Typography>
          <Typography variant="h2" className="mb-5 text-foreground">
            Business Services and <span className="text-primary">Consumer Essentials</span>
          </Typography>
          <Typography variant="p" className="text-muted-foreground">
            Miracle Natural supports retail shoppers and business partners with one quality-focused, herbal-first ecosystem.
          </Typography>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 md:p-7">
            <div className="mb-4 sm:mb-5">
              <Typography variant="label" className="mb-2 block text-primary">B2B</Typography>
              <Typography variant="h3" className="text-foreground">Leora Wellness Services</Typography>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {businessServices.map((item) => (
                <article key={item.title} className="rounded-lg border border-[var(--color-border-light)] bg-white/55 p-4">
                  <item.icon size={18} className="text-primary mb-2" />
                  <Typography variant="h4" className="mb-1 text-foreground">{item.title}</Typography>
                  <Typography variant="small" className="text-muted-foreground leading-relaxed">{item.desc}</Typography>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 md:p-7">
            <div className="mb-4 sm:mb-5">
              <Typography variant="label" className="mb-2 block text-accent">B2C</Typography>
              <Typography variant="h3" className="text-foreground">Top Consumer Picks</Typography>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {consumerPicks.map((item) => (
                <article key={item.title} className="rounded-lg border border-[var(--color-border-light)] bg-white/55 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-1"><item.icon size={18} className="text-accent" /></div>
                    <div>
                      <Typography variant="h4" className="mb-1 text-foreground">{item.title}</Typography>
                      <Typography variant="small" className="text-muted-foreground leading-relaxed">{item.desc}</Typography>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
};

export default FeatureGridSection;
