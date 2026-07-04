import React from 'react';
import { Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Typography } from './ui/Typography';

const FEATURES = [
  {
    icon: Leaf,
    title: "Herbal-Driven Formulas",
    desc: "Carefully selected herbal ingredients blended for affordable, effective daily personal care."
  },
  {
    icon: ShieldCheck,
    title: "ISO & GMP Certified",
    desc: "Products are developed and manufactured under certified quality standards."
  },
  {
    icon: Sparkles,
    title: "Mass-Market Friendly",
    desc: "Vibrant and approachable products designed for everyday consumers without compromising effectiveness."
  }
];

const STATS = [
  { value: "25+", label: "Years of Manufacturing Expertise" },
  { value: "2025", label: "Leora Wellness Founded" },
  { value: "ISO & GMP", label: "Certified Manufacturing Standards" },
];

// Deliberately asymmetric, full-bleed layout — a break from the repeated
// pale-card-in-gradient-box pattern used elsewhere on the landing page.
const MadeForSection = () => {
  return (
    <section id="about" className="relative py-14 sm:py-16 md:py-18 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.85fr] rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden border border-[var(--color-border-medium)] shadow-[0_24px_60px_rgba(24,37,28,0.12)]">
          <div className="p-7 sm:p-10 md:p-14 bg-[linear-gradient(160deg,rgba(255,251,242,0.96),rgba(247,241,227,0.88))] flex flex-col justify-center">
            <Typography variant="label" className="mb-3 block">Why Miracle Natural</Typography>
            <Typography variant="h2" className="text-foreground mb-4 text-balance">
              Crafted with care. <br /> <span className="text-primary">Rooted in nature.</span>
            </Typography>
            <Typography variant="p" className="mb-7 sm:mb-9 max-w-lg">
              Leora Wellness was established in 2025 and is backed by 25+ years of manufacturing expertise through Lanka Minerals and Chemicals.
            </Typography>

            <div className="space-y-5 sm:space-y-6">
              {FEATURES.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="shrink-0 h-11 w-11 rounded-xl border border-[var(--color-border-medium)] bg-white/70 inline-flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Typography variant="h4" className="mb-0.5 text-foreground text-[1rem]">{item.title}</Typography>
                    <p className="text-[0.88rem] leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative bg-[linear-gradient(165deg,#223026,#172117)] p-7 sm:p-10 md:p-14 flex flex-col justify-center gap-6 sm:gap-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-secondary/18 blur-3xl animate-blob-drift-slow" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-primary/22 blur-3xl animate-blob-drift" />

            {STATS.map((stat, i) => (
              <div key={stat.label} className="relative z-10">
                {i > 0 && <div className="h-px bg-white/12 mb-6 sm:mb-7" />}
                <p className="font-display text-[2.4rem] sm:text-[2.9rem] leading-none text-secondary">{stat.value}</p>
                <p className="mt-2 text-[0.78rem] uppercase tracking-[0.16em] text-[rgba(247,241,227,0.75)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MadeForSection;
