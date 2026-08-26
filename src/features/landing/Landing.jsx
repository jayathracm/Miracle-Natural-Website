import React from 'react';
import { useNavigate } from 'react-router';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>, <motion.section>)
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Factory, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { fadeUpEmphasis, fadeUpItem, staggerContainer, viewportOnce } from '@/shared/lib/motionVariants';
import BrandShowcase from '@/features/landing/sections/BrandShowcase';
import LeoraServicesSection from '@/features/landing/sections/LeoraServicesSection';
import SectionBand from '@/features/landing/sections/SectionBand';
import leoraIcon from '@/assets/branding/leora-wellness-icon-transparent.png';

const ABOUT_STATS = [
  { icon: Factory, label: 'Founded', value: 'December 2025' },
  { icon: ShieldCheck, label: 'Standards', value: 'ISO & GMP Certified' },
  { icon: Sparkles, label: 'Manufacturing Backbone', value: '25+ Years via LANMIC' },
];

// Neutral parent-company landing page at "/" — Leora Wellness itself, with
// no shop of its own. Just introduces the company and routes visitors into
// whichever sub-brand storefront they want.
const Landing = () => {
  const navigate = useNavigate();

  const trustPoints = [
    { icon: ShieldCheck, text: 'ISO & GMP Certified' },
    { icon: Leaf, text: '25+ Years Manufacturing Foundation' },
    { icon: Sparkles, text: 'Built By Lanka Minerals & Chemicals (LANMIC)' },
  ];

  const scrollToBrands = () => {
    document.getElementById('our-brands')?.scrollIntoView({ behavior: 'smooth' });
  };

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
            <span className="text-gradient-brand">Two storefronts.</span>
          </Typography>

          <Typography variant="p" className="max-w-xl text-muted-foreground">
            Leora Wellness (Pvt) Ltd is the personal-care manufacturing company behind Miracle Natural
            and Laira, built on 25+ years of manufacturing experience through Lanka Minerals and
            Chemicals (Pvt) Ltd (LANMIC).
          </Typography>

          <div className="flex flex-col sm:flex-row gap-3 pt-1 w-full sm:w-auto">
            <Button icon={ArrowRight} className="w-full sm:w-auto px-6 py-3" onClick={scrollToBrands}>
              Explore Our Brands
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

      <SectionBand>
        {/* About Leora Wellness */}
        <section className="py-10 sm:py-12 md:py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center">
            <motion.div
              variants={fadeUpItem}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <Typography variant="label" className="mb-3 block">About Us</Typography>
              <Typography variant="h2" className="mb-4 text-foreground text-balance">
                A manufacturing heritage behind every product.
              </Typography>
              <Typography variant="p" className="max-w-xl text-muted-foreground mb-5">
                Leora Wellness (Pvt) Ltd was established in December 2025 as a dedicated
                personal-care manufacturing company, built on a long-standing passion for wellness
                and self-care. We develop and manage Miracle Natural and Laira, backed by the
                manufacturing strength of our parent company, Lanka Minerals and Chemicals
                (Pvt) Ltd (LANMIC) — 25+ years of experience supporting quality, process
                consistency, and dependable production scale.
              </Typography>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://lanmic.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-light)] bg-white/75 px-3.5 py-2 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
                >
                  Mother Company: LANMIC
                  <ExternalLink size={12} />
                </a>
                <Button variant="ghost" className="px-4 py-2 text-[0.72rem]" onClick={() => navigate('/about')}>
                  Our Full Story
                </Button>
              </div>
            </motion.div>

            <motion.div
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-6 sm:p-7 shadow-[0_16px_36px_rgba(31,44,35,0.08)] space-y-4"
            >
              {ABOUT_STATS.map(({ icon: Icon, label, value }) => (
                <motion.div key={label} variants={fadeUpItem} className="flex items-center gap-3.5">
                  <span className="h-10 w-10 rounded-lg bg-primary/12 border border-primary/25 inline-flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-text-secondary">{label}</p>
                    <p className="text-[0.92rem] font-semibold text-foreground truncate">{value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Leora Wellness's own B2B services, not something Miracle Natural offers. */}
        <LeoraServicesSection />
      </SectionBand>

      {/* Our Brands — COD Modern Warfare-style expanding tile showcase */}
      <BrandShowcase />

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
            Miracle Natural is live now — Laira is on its way.
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
