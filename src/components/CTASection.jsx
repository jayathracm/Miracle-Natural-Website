import React from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { ArrowRight } from 'lucide-react';
import { fadeUpEmphasis, viewportOnce } from '../lib/motionVariants';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section id="cta" className="relative py-14 sm:py-16 md:py-18 px-4 sm:px-6 flex flex-col items-center justify-center overflow-hidden">

      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] bg-secondary/20 blur-[120px] rounded-full"
          initial={{ opacity: 0.4, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute bottom-0 inset-x-0 h-px" style={{ backgroundColor: 'var(--color-border-light)' }} />
      </div>

      <motion.div
        className="relative z-10 text-center max-w-3xl mx-auto rounded-xl border border-[var(--color-card-border)] bg-[rgba(255,251,242,0.82)] px-6 py-10 sm:px-10 sm:py-12 shadow-[0_20px_45px_rgba(31,44,35,0.12)]"
        variants={fadeUpEmphasis}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <Typography variant="label" className="mb-4 block">Ready For Your Glow Era?</Typography>

        <Typography variant="h2" className="mb-4 sm:mb-5 text-foreground leading-tight">
          Begin Your <br /> Miracle Natural Ritual.
        </Typography>

        <Typography variant="p" className="mb-7 sm:mb-8 max-w-xl mx-auto">
          Shop your first bundle and feel the difference of gentle, botanical personal care.
        </Typography>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/shop')}
            icon={ArrowRight}
            className="w-full sm:w-auto px-8 py-3"
          >
            Shop The Collection
          </Button>
          <Button
            variant="ghost"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto px-8 py-3"
          >
            View Bundles
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
