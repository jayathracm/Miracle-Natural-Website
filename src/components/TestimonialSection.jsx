import React from 'react';
import { Star } from 'lucide-react';
import { Typography } from './ui/Typography';
import { testimonials } from '../data';

const TestimonialSection = () => {
  return (
    <section id="testimonials" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-14">
          <Typography variant="label" className="mb-4 block">Customer Reviews</Typography>
          <Typography variant="h2" className="mb-5 text-foreground">
            Real feedback from <span className="text-primary">daily users</span>
          </Typography>
          <Typography variant="p" className="text-muted-foreground">
            Honest outcomes from customers who made Miracle Natural part of their routine.
          </Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {testimonials.map((item) => (
            <article
              key={`${item.name}-${item.studio}`}
              className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={`${item.name}-star-${i}`} size={14} className={i < (item.rating || 5) ? 'fill-primary text-primary' : 'text-[var(--color-border-medium)]'} />
                ))}
              </div>
              <Typography variant="p" className="text-foreground leading-relaxed mb-4">"{item.testimonial}"</Typography>
              <div className="pt-3 border-t border-[var(--color-border-light)]">
                <p className="text-[0.76rem] font-bold tracking-[0.14em] uppercase text-foreground">{item.name}</p>
                <p className="text-[0.82rem] text-muted-foreground mt-1">{item.studio} · {item.location}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
