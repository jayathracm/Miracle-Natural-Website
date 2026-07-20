import React from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { shopPathForBrand } from '../lib/brands';
import lairaWordmark from '../assets/branding/laira-wordmark-transparent.png';

// Laira is the second Leora Wellness sub-brand tab — deliberately a minimal
// "work in progress" placeholder for now (per explicit scope decision: no
// real product content yet). It still shares the Navbar's Shop link so
// visitors aren't stuck, and links back to Miracle Natural for anyone who
// landed here looking for the brand that's actually live today.
const Laira = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[70vh] pt-34 sm:pt-36 md:pt-38 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[18%] left-[8%] w-60 h-60 rounded-full bg-secondary/16 blur-[90px] animate-blob-drift" />
        <div className="absolute bottom-[12%] right-[6%] w-64 h-64 rounded-full bg-primary/10 blur-[90px] animate-blob-drift-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full text-center rounded-2xl border border-[var(--color-card-border)] bg-[rgba(255,251,242,0.88)] px-6 py-10 sm:px-10 sm:py-14 shadow-[0_20px_45px_rgba(31,44,35,0.1)]"
      >
        <img src={lairaWordmark} alt="Laira — The Best Version of You" className="h-14 sm:h-16 w-auto object-contain mx-auto mb-6" />

        <span className="inline-flex rounded-full border border-[var(--color-border-medium)] bg-white/80 px-3.5 py-1.5 text-[0.7rem] font-bold tracking-[0.14em] uppercase text-text-secondary mb-5">
          Coming Soon
        </span>

        <Typography variant="p" className="max-w-md mx-auto mb-8">
          Laira is a new wellness brand from Leora Wellness, currently taking shape.
          There&apos;s nothing to show just yet — check back soon for the full introduction.
        </Typography>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button icon={ShoppingBag} className="w-full sm:w-auto px-6 py-3" onClick={() => navigate(shopPathForBrand('miracle_natural'))}>
            Shop Now
          </Button>
          <Button variant="ghost" icon={ArrowRight} className="w-full sm:w-auto px-6 py-3" onClick={() => navigate('/miracle-natural')}>
            Explore Miracle Natural
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default Laira;
