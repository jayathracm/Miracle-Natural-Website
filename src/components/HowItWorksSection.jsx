import React from 'react';
import { Typography } from './ui/Typography';
import { steps } from '../data';

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-14">
          <Typography variant="label" className="mb-4 block">The Miracle Ritual</Typography>
          <Typography variant="h2" className="mb-5 text-foreground">
            Build your routine in <span className="text-primary">six clear steps</span>
          </Typography>
          <Typography variant="p" className="text-muted-foreground">
            A simplified format inspired by modern skincare education pages, adapted for Miracle Natural products.
          </Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {steps.map((step) => (
            <article
              key={step.number}
              className="group rounded-xl border border-[var(--color-card-border)] bg-[rgba(255,252,245,0.9)] overflow-hidden"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[linear-gradient(160deg,rgba(255,251,243,0.98),rgba(243,234,215,0.9))]">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  style={{ objectPosition: step.imagePosition || 'center center' }}
                  loading="lazy"
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-[0.8rem] font-bold mb-3">
                  {step.number}
                </div>
                <Typography variant="h4" className="mb-2 text-foreground">{step.title}</Typography>
                <Typography variant="small" className="text-muted-foreground leading-relaxed mb-3 block">
                  {step.description}
                </Typography>
                <p className="text-[0.8rem] uppercase tracking-[0.09em] font-semibold text-accent">{step.highlight}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
