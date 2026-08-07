import React from 'react';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { Typography } from '@/shared/ui/Typography';
import { staggerContainer, fadeUpItem, viewportOnce } from '@/shared/lib/motionVariants';

// Small hand-drawn-style botanical line icons, matching lucide's own
// conventions (24x24 viewBox, currentColor stroke, rounded caps/joins) so
// they sit naturally next to the lucide icons used everywhere else on the
// site. Per the brand portfolio's own visual identity guidance, Miracle
// Natural deliberately avoids stock photography of leaves/plants in favor of
// illustrated botanicals — these are that, scaled down to icon size.
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const CinnamonIcon = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M8 4c5 0 8 2.2 8 5s-3 4.2-6.2 3.4" />
    <path d="M9.8 12.4c-1.6-.6-2.6-1.7-2.6-3.1" />
    <path d="M6 9c0 3.6 1.6 7.4 5 9.6c3.4-2.2 5-6 5-9.6" />
  </svg>
);

const NeemIcon = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M12 3c4.5 3 5.5 8 3 12.5C10.5 20 6 20.5 4 19c1-3.5 3-8.5 8-16z" />
    <path d="M6 18c2.5-4 5-8 8.5-12" />
  </svg>
);

const AloeVeraIcon = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M12 21c-1-5-1.4-10-.6-16.2C15 6.5 16.8 11 16.4 21" />
    <path d="M12 21c-.6-4.6-2.4-8.6-5.8-12.6C7 12.4 8.6 17.2 12 21z" />
  </svg>
);

const AmlaIcon = (props) => (
  <svg {...iconProps} {...props}>
    <circle cx="12" cy="14" r="6" />
    <path d="M12 8V4" />
    <path d="M12 4c1.4 0 2.4.8 2.8 2" />
  </svg>
);

const SandalwoodIcon = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M12 21v-7" />
    <path d="M12 14c-4 0-7-2.6-7-6.5S8.2 3 12 3s7 1.6 7 4.5S16 14 12 14z" />
    <circle cx="12" cy="8.3" r="2.2" />
  </svg>
);

const TurmericIcon = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M6 15c-1.4-1.6-1.4-3.8.2-5.2c1.6-1.4 3.6-.8 4.6.8c.6-2 2.4-3 4.2-2.4c1.8.6 2.6 2.6 1.8 4.4c1.6.4 2.6 2 2.2 3.6c-.4 1.8-2.2 2.8-4 2.4c-3-.6-7-1-9-3.6z" />
  </svg>
);

// Real ingredients pulled from the actual product copy already on the site
// (ProductSection.jsx / Shop catalog) — not invented for this section. The
// benefit tags mirror the same language used on each product's own listing,
// so this stays consistent with what customers find deeper in the site.
const INGREDIENTS = [
  { icon: CinnamonIcon, name: 'Cinnamon', benefit: 'Root repair' },
  { icon: NeemIcon, name: 'Neem', benefit: 'Scalp comfort' },
  { icon: AloeVeraIcon, name: 'Aloe Vera', benefit: 'Deep hydration' },
  { icon: AmlaIcon, name: 'Amla', benefit: 'Fuller-looking hair' },
  { icon: SandalwoodIcon, name: 'Sandalwood', benefit: 'Even, glowing tone' },
  { icon: TurmericIcon, name: 'Turmeric', benefit: 'Brightening' },
];

const IngredientsSection = () => {
  return (
    <section className="py-14 sm:py-16 md:py-18 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <Typography variant="label" className="mb-4 block">Ingredients We Trust</Typography>
          <Typography variant="h2" className="mb-4 text-foreground text-balance">
            We don&rsquo;t hide our ingredients. <span className="text-primary">We celebrate them.</span>
          </Typography>
          <Typography variant="p" className="text-muted-foreground">
            Every Miracle Natural formula is built around real, named botanicals — the same
            ingredients Sri Lankan households have trusted for generations.
          </Typography>
        </div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-5"
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {INGREDIENTS.map((item) => (
            <motion.div
              key={item.name}
              variants={fadeUpItem}
              className="flex flex-col items-center text-center rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 py-5 sm:py-6"
            >
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-[var(--color-border-medium)] bg-white/70 inline-flex items-center justify-center mb-3">
                <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <Typography variant="h4" className="text-foreground text-[0.9rem] sm:text-[0.95rem] mb-0.5">
                {item.name}
              </Typography>
              <p className="text-[0.72rem] sm:text-[0.76rem] text-muted-foreground leading-snug">
                {item.benefit}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default IngredientsSection;
