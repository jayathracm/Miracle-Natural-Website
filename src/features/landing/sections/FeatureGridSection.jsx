import React from 'react';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { Droplets, Moon, Heart } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { staggerContainer, fadeUpItem, viewportOnce } from '@/shared/lib/motionVariants';

// This used to render two side-by-side panels — a B2B "Leora Wellness
// Services" grid plus this consumer-picks list. The B2B half moved to the
// Leora Wellness homepage (LeoraServicesSection.jsx): those are Leora
// Wellness's own manufacturing/wholesale services, not something the
// Miracle Natural page should be advertising. What's left here is purely
// Miracle Natural's own consumer-facing content.
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
          <Typography variant="label" className="mb-4 block">Top Picks</Typography>
          <Typography variant="h2" className="mb-5 text-foreground">
            Everyday <span className="text-primary">Consumer Essentials</span>
          </Typography>
          <Typography variant="p" className="text-muted-foreground">
            A few Miracle Natural favorites, loved for their quality-focused, herbal-first formulas.
          </Typography>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {consumerPicks.map((item) => (
            <motion.article
              key={item.title}
              variants={fadeUpItem}
              className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6"
            >
              <item.icon size={20} className="text-accent mb-3" />
              <Typography variant="h4" className="mb-1.5 text-foreground">{item.title}</Typography>
              <Typography variant="small" className="text-muted-foreground leading-relaxed">{item.desc}</Typography>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureGridSection;
