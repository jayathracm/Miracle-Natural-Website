import React, { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { cn } from '@/shared/lib/utils';
import { staggerContainer, fadeUpItem, viewportOnce } from '@/shared/lib/motionVariants';

const faqs = [
  {
    question: 'What makes Miracle Natural different from other herbal brands?',
    answer:
      "Traditional Sri Lankan herbal remedies take time and effort to prepare at home. Miracle Natural bridges that gap — the same trusted botanical ingredients, combined with modern manufacturing and formulation science, so you get the benefits without the effort, at a price that doesn't ask you to compromise.",
  },
  {
    question: 'Are Miracle Natural products suitable for sensitive skin?',
    answer:
      'Most formulas are designed for gentle daily use, and we avoid harsh blends. We still recommend a small patch test before first use.',
  },
  {
    question: 'How long does it take to see results?',
    answer:
      'Many customers notice hydration and softness within days, while tone and texture improvements are usually visible after consistent use over 3 to 6 weeks.',
  },
  {
    question: 'Can I use face, body, and hair products together?',
    answer:
      'Yes. The line is built as a complete routine, so products are designed to complement each other across face, body, and hair care.',
  },
  {
    question: 'Where do you deliver?',
    answer:
      'We currently deliver nationwide, with standard and express options at checkout. Delivery timelines vary by location.',
  },
];

const AccordionItem = ({ question, answer, isOpen, onClick, isMobile }) => {
  return (
    <div
      className={cn(
        "group relative overflow-hidden transition-all duration-300 rounded-lg border border-[var(--color-border-light)]",
        isOpen ? "bg-[rgba(255,252,245,0.96)] border-[var(--color-primary)]" : "bg-[rgba(255,252,245,0.75)] hover:border-[var(--color-border-medium)]"
      )}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 sm:p-5 md:p-5 text-left focus:outline-none"
      >
        <Typography
          variant="h4"
          className={cn(
            "transition-colors duration-300 pr-3",
            isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
          )}
        >
          {question}
        </Typography>
        <div className={cn(
          "flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
        )}>
          <Plus size={16} strokeWidth={3} className={cn("transition-transform duration-300", isOpen && "scale-0 opacity-0")} />
          <Minus size={16} strokeWidth={3} className={cn("absolute transition-transform duration-300", !isOpen && "scale-0 opacity-0")} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: isMobile ? 0.25 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-4 sm:px-5 md:px-5 pb-5 pt-0">
              <div className="h-px w-full bg-primary/10 mb-4" />
              <Typography variant="p" className="text-muted-foreground leading-relaxed">
                {answer}
              </Typography>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QnASection = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // FAQPage structured data (schema.org / Google's FAQ rich-result format) —
  // lets search engines (and AI answer engines that read JSON-LD) surface
  // these Q&As directly, rather than only being readable inside the
  // accordion UI. Injected/removed with the section itself rather than
  // living in useSEO, since it's tied to this specific content, not a
  // per-route <head> tag.
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <section className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-primary/10 blur-[110px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 md:mb-14 space-y-5">
          <div className="space-y-4">
            <Typography variant="label" className="block text-center">Support & Help</Typography>
            <Typography variant="h2" className="text-foreground leading-[1.1] text-center">
              Frequently Asked <br />
              <span className="text-primary">Questions.</span>
            </Typography>
          </div>

          <Typography variant="p" className="max-w-2xl mx-auto text-center">
            Everything you need to know before choosing your Miracle Natural routine.
          </Typography>
        </div>

        {/* Accordion List */}
        <motion.div
          className="space-y-3 md:space-y-4"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeUpItem}>
              <AccordionItem
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                isMobile={isMobile}
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10 sm:mt-12 text-center">
          <Typography variant="p" className="mb-2">
            Still have questions?
          </Typography>
          <p className="text-[0.92rem] sm:text-[0.95rem]">
            Email{' '}
            <a href="mailto:dinisha@lanmic.com" className="email-link">dinisha@lanmic.com</a>
            {' '}or call/WhatsApp{' '}
            <a href="tel:+94112636832" className="email-link">+94 11 2636 832</a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default QnASection;
