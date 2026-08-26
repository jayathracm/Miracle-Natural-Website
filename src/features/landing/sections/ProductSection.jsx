import React from 'react';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { Typography } from '@/shared/ui/Typography';
import { TiltCard } from '@/shared/ui/TiltCard';
import shampooImg from '@/assets/lifestyle/hair-care-lifestyle.jpeg';
import bodyLotionImg from '@/assets/lifestyle/body-care-lifestyle.jpeg';
import faceWashImg from '@/assets/lifestyle/face-care-lifestyle.jpeg';
import serumImg from '@/assets/lifestyle/treatment-lifestyle.jpeg';

// Each card represents a product category, not one specific SKU — lifestyle
// photos, general copy for the whole category.
const products = [
  {
    title: 'Hair Care Essentials',
    category: 'Hair Care',
    stat: 'Herbal actives in every formula',
    description: 'Shampoo, conditioner, and hair oil formulated with cinnamon, neem, aloe vera, and amla for scalp comfort, root repair, and fuller-looking hair.',
    image: shampooImg,
  },
  {
    title: 'Body Care Essentials',
    category: 'Body Care',
    stat: 'Lotion & herbal soap bars',
    description: 'Body lotion and herbal soap bars in sandalwood, moringa, cinnamon, venivel, and turmeric — daily moisture and gentle, naturally-derived cleansing.',
    image: bodyLotionImg,
  },
  {
    title: 'Face Care Essentials',
    category: 'Face Care',
    stat: 'Daily cleanse to weekly care',
    description: 'Cleansers, day and night creams, and weekly treatment packs and scrubs — pH-balanced formulas for daily cleansing and a refreshed, even-looking glow.',
    image: faceWashImg,
  },
  {
    title: 'Targeted Treatments',
    category: 'Treatment',
    stat: 'Concentrated, targeted formulas',
    description: 'Serums and targeted gels for visible marks, uneven tone, and specific skin concerns — an extra step for when your routine needs more focus.',
    image: serumImg,
  },
];

const gridRevealVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const ProductSection = () => {
  return (
    <section id="product" className="py-18 sm:py-22 md:py-24 px-4 sm:px-6 md:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="relative mb-8 md:mb-10 overflow-hidden rounded-2xl border border-[var(--color-border-medium)] bg-[linear-gradient(120deg,rgba(255,251,242,0.92),rgba(247,241,227,0.8))] p-6 sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -left-14 -top-16 h-44 w-44 rounded-full bg-[rgba(184,111,67,0.15)] blur-3xl animate-blob-drift" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-52 w-52 rounded-full bg-[rgba(79,113,84,0.14)] blur-3xl animate-blob-drift-slow" />

          <div className="relative z-10">
            <div>
              <Typography variant="label" className="mb-4 block">Catalog Highlights</Typography>
              <Typography variant="h2" className="text-foreground mb-4 text-balance">
                Targeted formulas built for modern routines.
              </Typography>
              <Typography variant="p" className="max-w-2xl text-[1rem] leading-relaxed text-text-secondary">
                Lightweight textures, treatment-grade ingredients, and ritual-friendly formats designed for skin and hair care that feels premium without being complicated.
              </Typography>
            </div>
          </div>
        </div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
            variants={gridRevealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {products.map((product, index) => (
              <motion.div key={product.title} variants={gridItemVariants} className="h-full">
                <TiltCard
                  as="article"
                  className="group h-full flex flex-col overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_14px_36px_rgba(24,37,28,0.08)] transition-colors duration-500 hover:border-[var(--color-card-border-hover)]"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${index % 2 === 0 ? 'from-[rgba(79,113,84,0.55)] via-[rgba(79,113,84,0.22)] to-transparent' : 'from-[rgba(184,111,67,0.5)] via-[rgba(184,111,67,0.2)] to-transparent'}`} />

                  <div className="relative aspect-[5/6] overflow-hidden bg-[linear-gradient(160deg,rgba(255,252,245,0.95),rgba(243,234,215,0.88))]">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[rgba(17,26,20,0.2)] to-transparent" />
                    <div className="absolute left-3 top-3 rounded-full border border-white/40 bg-white/80 px-2.5 py-1 backdrop-blur-sm">
                      <p className="text-[0.56rem] uppercase tracking-[0.2em] font-semibold text-text-secondary">{product.category}</p>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                    <Typography variant="h4" className="mb-2 text-foreground text-[0.92rem] sm:text-[1rem] leading-snug">{product.title}</Typography>
                    <Typography variant="small" className="text-muted-foreground leading-relaxed mb-3 text-[0.72rem] sm:text-[0.76rem]">{product.description}</Typography>

                    <div className="mt-auto rounded-lg border border-[var(--color-border-light)] bg-white/70 px-2.5 py-2">
                      <p className="text-[0.58rem] uppercase tracking-[0.18em] font-semibold text-text-tertiary">Signature Benefit</p>
                      <p className="mt-1 text-[0.7rem] sm:text-[0.74rem] text-text-secondary font-medium leading-snug">{product.stat}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
      </div>
    </section>
  );
};

export default ProductSection;
