import React from 'react';
import { Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Typography } from './ui/Typography';
import { Card } from './ui/Card';

const MadeForSection = () => {
  return (
    <section id="about" className="relative py-14 sm:py-16 md:py-18 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 md:mb-14">
          <Typography variant="label" className="mb-3 block">Why Miracle Natural</Typography>
          <Typography variant="h2" className="text-foreground mb-4">
            Crafted with care. <br /> <span className="text-primary">Rooted in nature.</span>
          </Typography>
          <Typography variant="p">
            Leora Wellness was established in 2025 and is backed by 25+ years of manufacturing expertise through Lanka Minerals and Chemicals.
          </Typography>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              icon: Leaf,
              color: "text-primary",
              title: "Herbal-Driven Formulas",
              desc: "Carefully selected herbal ingredients blended for affordable, effective daily personal care."
            },
            {
              icon: ShieldCheck,
              color: "text-accent",
              title: "ISO & GMP Certified",
              desc: "Products are developed and manufactured under certified quality standards."
            },
            {
              icon: Sparkles,
              color: "text-blue-400",
              title: "Mass-Market Friendly",
              desc: "Vibrant and approachable products designed for everyday consumers without compromising effectiveness."
            }
          ].map((item, i) => (
            <Card key={i} className="transition-colors rounded-xl" style={{
              backgroundColor: 'var(--color-card-bg)',
              border: '1px solid var(--color-card-border)'
            }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-card-bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-card-bg)'}>
              <item.icon className={`w-7 h-7 mb-4 ${item.color}`} />
              <Typography variant="h4" className="mb-2 text-foreground">{item.title}</Typography>
              <Typography variant="p">{item.desc}</Typography>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MadeForSection;
