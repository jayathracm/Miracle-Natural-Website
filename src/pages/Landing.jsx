import React from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>, <motion.section>)
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { staggerContainer, fadeUpItem, fadeUpEmphasis, viewportOnce } from '../lib/motionVariants';
import { shopPathForBrand } from '../lib/brands';
import leoraIcon from '../assets/branding/leora-wellness-icon-transparent.png';
import miracleNaturalIcon from '../assets/branding-from-pdf/miracle-natural-logo-icon-transparent.png';
import lairaWordmark from '../assets/branding/laira-wordmark-transparent.png';

// This is the neutral "parent company" landing page at "/" — Leora Wellness
// sits above three storefronts (its own, plus the two consumer-facing
// sub-brands Miracle Natural and Laira), each with their own dedicated shop
// and cart (functional-requirements.md §1.9: three separate storefronts,
// one shared products table tagged by brand). This page's job is purely to
// introduce Leora Wellness and route visitors into whichever storefront
// they came for — it deliberately does not duplicate any brand's own
// marketing content.
const Landing = () => {
  const navigate = useNavigate();

  const trustPoints = [
    { icon: ShieldCheck, text: 'ISO & GMP Certified' },
    { icon: Leaf, text: '25+ Years Manufacturing Foundation' },
    { icon: Sparkles, text: 'Built By Lanka Minerals & Chemicals (LANMIC)' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[62vh] pt-34 sm:pt-36 md:pt-38 pb-10 sm:pb-12 md:pb-14 px-4 sm:px-6 lg:px-8 flex flex-col items-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[6%] w-64 h-64 rounded-full bg-secondary/20 blur-[80px] animate-blob-drift" />
          <div className="absolute top-[16%] right-[4%] w-72 h-72 rounded-full bg-primary/14 blur-[90px] animate-blob-drift-slow" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-3xl w-full flex flex-col items-center text-center gap-5 sm:gap-6"
        >
          <img src={leoraIcon} alt="" aria-hidden="true" className="h-14 sm:h-16 w-auto object-contain" />

          <Typography variant="label" className="text-primary">Leora Wellness (Pvt) Ltd</Typography>

          <Typography variant="h1" className="text-foreground text-[2.2rem] sm:text-[2.75rem] md:text-[3.3rem] leading-[1.08]">
            One wellness company.<br />
            <span className="text-gradient-brand">Three storefronts.</span>
          </Typography>

          <Typography variant="p" className="max-w-xl text-muted-foreground">
            Leora Wellness is the personal-care manufacturing company behind its own product line,
            Miracle Natural, and Laira, built on 25+ years of manufacturing experience through
            Lanka Minerals and Chemicals (Pvt) Ltd (LANMIC).
          </Typography>

          <div className="flex flex-col sm:flex-row gap-3 pt-1 w-full sm:w-auto">
            <Button icon={ArrowRight} className="w-full sm:w-auto px-6 py-3" onClick={() => navigate(shopPathForBrand('leora_wellness'))}>
              Shop Now
            </Button>
            <Button variant="ghost" className="w-full sm:w-auto px-6 py-3" onClick={() => navigate('/about')}>
              About Leora Wellness
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-4">
            {trustPoints.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon size={14} className="text-primary shrink-0" />
                <span className="text-[0.78rem] font-semibold tracking-[0.04em] uppercase text-text-secondary">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Our Brands */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-14">
        <div className="max-w-[1320px] mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <Typography variant="label" className="mb-3 block text-primary">Our Brands</Typography>
            <Typography variant="h2" className="text-foreground text-balance">
              Three storefronts, one standard of care.
            </Typography>
          </div>

          <motion.div
            variants={staggerContainer(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
          >
            {/* Leora Wellness card — the parent brand's own (currently empty) line */}
            <motion.div
              variants={fadeUpItem}
              className="relative rounded-2xl border border-[var(--color-border-medium)] bg-white/70 p-6 sm:p-8 shadow-[0_16px_36px_rgba(31,44,35,0.06)] flex flex-col items-start overflow-hidden"
            >
              <span className="absolute top-5 right-5 rounded-full border border-[var(--color-border-medium)] bg-white/90 px-3 py-1 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-text-secondary">
                Coming Soon
              </span>
              <img src={leoraIcon} alt="" aria-hidden="true" className="h-14 w-14 object-contain mb-5" />
              <Typography variant="h3" className="text-foreground mb-2">Leora Wellness</Typography>
              <Typography variant="p" className="mb-6">
                Our own direct product line, launching under the Leora Wellness name —
                details and products are still being finalized.
              </Typography>
              <Button variant="ghost" icon={ArrowRight} className="mt-auto w-full sm:w-auto" onClick={() => navigate(shopPathForBrand('leora_wellness'))}>
                Preview Leora Wellness Shop
              </Button>
            </motion.div>

            {/* Miracle Natural card */}
            <motion.div
              variants={fadeUpItem}
              className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-6 sm:p-8 shadow-[0_16px_36px_rgba(31,44,35,0.08)] flex flex-col items-start"
            >
              <img src={miracleNaturalIcon} alt="" aria-hidden="true" className="h-16 w-16 object-contain mb-5" />
              <Typography variant="h3" className="text-foreground mb-2">Miracle Natural</Typography>
              <Typography variant="p" className="mb-6">
                Herbal-based personal care for everyday rituals — face, body, hair, and lip care,
                made accessible without compromising on quality.
              </Typography>
              <Button icon={ArrowRight} className="mt-auto w-full sm:w-auto" onClick={() => navigate('/miracle-natural')}>
                Explore Miracle Natural
              </Button>
            </motion.div>

            {/* Laira card — work in progress */}
            <motion.div
              variants={fadeUpItem}
              className="relative rounded-2xl border border-[var(--color-border-medium)] bg-white/70 p-6 sm:p-8 shadow-[0_16px_36px_rgba(31,44,35,0.06)] flex flex-col items-start overflow-hidden"
            >
              <span className="absolute top-5 right-5 rounded-full border border-[var(--color-border-medium)] bg-white/90 px-3 py-1 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-text-secondary">
                Coming Soon
              </span>
              <img src={lairaWordmark} alt="Laira — The Best Version of You" className="h-10 w-auto object-contain mb-7 mt-1 grayscale" />
              <Typography variant="p" className="mb-6">
                A new wellness line from Leora Wellness is taking shape. The Laira experience
                will land here as soon as it&apos;s ready.
              </Typography>
              <Button variant="ghost" icon={ArrowRight} className="mt-auto w-full sm:w-auto" onClick={() => navigate('/laira')}>
                Preview Laira
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Closing CTA — points at the one storefront that's actually live today */}
      <section className="relative py-12 sm:py-14 md:py-16 px-4 sm:px-6 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-secondary/18 blur-[120px] rounded-full"
            initial={{ opacity: 0.4, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-2xl mx-auto rounded-xl border border-[var(--color-card-border)] bg-[rgba(255,251,242,0.82)] px-6 py-9 sm:px-10 sm:py-11 shadow-[0_20px_45px_rgba(31,44,35,0.12)]"
          variants={fadeUpEmphasis}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <Typography variant="label" className="mb-3 block">Ready To Shop Today</Typography>
          <Typography variant="h3" className="mb-4 text-foreground">
            Miracle Natural is live now — the other storefronts are on their way.
          </Typography>
          <Button icon={ArrowRight} className="px-8 py-3" onClick={() => navigate('/miracle-natural/shop')}>
            Shop Miracle Natural
          </Button>
        </motion.div>
      </section>
    </>
  );
};

export default Landing;
