import React from 'react';
import { useNavigate } from 'react-router';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.article>, <motion.div>)
import { motion } from 'framer-motion';
import { ArrowRight, FlaskConical, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { staggerContainer, fadeUpItem, viewportOnce } from '@/shared/lib/motionVariants';

// The B2B/manufacturing side of Leora Wellness — moved here from
// FeatureGridSection.jsx, which originally rendered this alongside a
// consumer-picks panel on the Miracle Natural page. That placement didn't
// make sense once Leora Wellness stopped being a shoppable brand and became
// the parent-company homepage: these are Leora Wellness's own services, not
// something Miracle Natural offers, so they belong here instead.
const SERVICES = [
  {
    icon: Leaf,
    title: 'Salon & Spa Bulk Products',
    desc: 'Bulk shampoos, conditioners, masks, cleansers, and men’s grooming products with refill plans.',
  },
  {
    icon: ShieldCheck,
    title: 'Raw Material Bulk Supply',
    desc: 'Bases for soap, shampoo, conditioner, cream, and scrub with B2B volume support.',
  },
  {
    icon: Sparkles,
    title: 'Contract Manufacturing',
    desc: 'OEM and private label support from formulation to filling and labeling with flexible MOQs.',
  },
  {
    icon: FlaskConical,
    title: 'Hospitality Packs',
    desc: 'Travel-size hotel bundles with custom branding and monthly refill options.',
  },
];

const LeoraServicesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="pb-10 sm:pb-12 md:pb-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <Typography variant="label" className="mb-3 block">B2B</Typography>
          <Typography variant="h2" className="text-foreground text-balance">Leora Wellness Services</Typography>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {SERVICES.map((item) => (
            <motion.article
              key={item.title}
              variants={fadeUpItem}
              className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6"
            >
              <item.icon size={18} className="text-primary mb-2.5" />
              <Typography variant="h4" className="mb-1.5 text-foreground">{item.title}</Typography>
              <Typography variant="small" className="text-muted-foreground leading-relaxed">{item.desc}</Typography>
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-7 flex justify-center">
          <Button icon={ArrowRight} className="px-6 py-3" onClick={() => navigate('/corporate-partner')}>
            Business & Wholesale Inquiries
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LeoraServicesSection;
