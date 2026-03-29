import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { ArrowRight } from 'lucide-react';

const catalogImageModules = import.meta.glob('../assets/catalog/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

const formatImageLabel = (path) => {
  const fileName = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'product image';
  return fileName.replace(/[-_]+/g, ' ').trim();
};

const HeroSection = () => {
  const textRef = useRef(null);
  const subtextRef = useRef(null);
  const buttonsRef = useRef(null);
  const rotateRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = useMemo(() => {
    return Object.entries(catalogImageModules)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, src]) => ({
        src,
        alt: `Miracle Natural ${formatImageLabel(path)}`,
      }));
  }, []);

  useEffect(() => {
    // Defer animations to next frame after initial render/paint
    const animationFrame = requestAnimationFrame(() => {
      const ctx = gsap.context(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const headlineDuration = isMobile ? 0.4 : 0.6;
        const contentDuration = isMobile ? 0.3 : 0.5;
        
        // Batch set initial states for all elements at once
        gsap.set([textRef.current, subtextRef.current, buttonsRef.current], {
          autoAlpha: 0
        });
        
        gsap.set(textRef.current, { x: isMobile ? 0 : -20 });
        gsap.set([subtextRef.current, buttonsRef.current], { y: isMobile ? 10 : 20 });

        // Animate with optimized timeline
        const tl = gsap.timeline({
          defaults: {
            ease: 'power2.out'
          }
        });

        tl.to(textRef.current, {
          autoAlpha: 1,
          x: 0,
          duration: headlineDuration,
          clearProps: 'all'
        })
        .to(subtextRef.current, {
          autoAlpha: 1,
          y: 0,
          duration: contentDuration,
          clearProps: 'all'
        }, '-=0.3')
        .to(buttonsRef.current, {
          autoAlpha: 1,
          y: 0,
          duration: contentDuration,
          clearProps: 'all'
        }, '-=0.2');

        // Rotation animation for decorative element - only on desktop
        if (rotateRef.current && !isMobile) {
          gsap.to(rotateRef.current, { 
            rotation: 360, 
            duration: 120, 
            repeat: -1, 
            ease: 'none'
          });
        }
      });

      return () => ctx.revert();
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 2800);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  return (
    <section id="hero" className="relative min-h-[82vh] md:min-h-[90vh] pt-34 sm:pt-36 md:pt-38 lg:pt-42 pb-8 sm:pb-10 md:pb-12 lg:pb-14 px-4 sm:px-6 lg:px-8 flex flex-col items-center bg-transparent">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[12%] left-[4%] w-64 h-64 rounded-full bg-secondary/25 blur-[70px]" />
        <div className="absolute top-[20%] right-[2%] w-72 h-72 rounded-full bg-primary/16 blur-[80px]" />
      </div>

      {/* Asymmetric Layout Wrapper */}
      <div className="max-w-[1320px] w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 sm:gap-10 lg:gap-14 xl:gap-18 items-center mb-8 sm:mb-10 md:mb-12 lg:mb-14 relative z-10">

        {/* Text Content */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 sm:space-y-5 lg:space-y-7 z-10">
          <div ref={textRef} className="space-y-1.5 sm:space-y-3 md:space-y-4 w-full">
            <Typography variant="label" className="mb-2 block text-primary">Herbal Care by Leora Wellness</Typography>
            <Typography
              variant="h1"
              className="text-foreground tracking-tight pt-1 sm:pt-2 md:pt-3 pb-0 text-[2.55rem] sm:text-[3.1rem] md:text-[3.6rem] lg:text-[4.2rem] xl:text-[4.9rem] leading-[1.04]"
            >
              <span className="text-primary">Botanical Personal Care</span><br />
              crafted for<br />
              <span className="text-foreground">everyday rituals</span>
            </Typography>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-1 sm:gap-y-1.5 items-center">
              {[
                "Clean Ingredients",
                "Science-Led Formulas",
                "Visible Daily Results"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-[0.9rem] sm:text-[0.95rem] md:text-[1rem] lg:text-[1.05rem] font-semibold tracking-[0.04em] uppercase text-foreground">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div ref={subtextRef} className="w-full flex justify-center lg:justify-start">
            <Typography variant="p" className="max-w-2xl text-muted-foreground leading-relaxed text-[1rem] sm:text-[1.02rem] md:text-[1.05rem] lg:text-[1.08rem]">
              Miracle Natural is a herbal-based personal care brand under Leora Wellness, combining carefully selected herbal ingredients with modern formulation expertise.
            </Typography>
          </div>

          <div ref={buttonsRef} className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-3.5 pt-2 sm:pt-4">
            <Button
              icon={ArrowRight}
              className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
              onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Collection
            </Button>
            <Button
              variant="ghost"
              className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
              onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start Your Ritual
            </Button>
          </div>
        </div>

        {/* Visual/Abstract Content */}
        <div className="relative hidden lg:block justify-self-end w-full max-w-[460px] xl:max-w-[520px]">
          <div className="relative z-10 aspect-[4/5] w-full rounded-[2.1rem] overflow-hidden border border-[var(--color-border-light)] shadow-[0_20px_44px_rgba(31,44,35,0.2)] bg-[rgba(255,252,245,0.95)]">
            {slides.map((slide, index) => (
              <img
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                width="820"
                height="1200"
                className={`absolute inset-0 h-full w-full object-cover object-center mix-blend-normal transition-opacity duration-700 ${index === activeSlide ? 'opacity-96' : 'opacity-0'}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            ))}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(255,248,234,0.55)] to-transparent" />
            {slides.length > 1 && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
                {slides.map((slide, index) => (
                  <button
                    key={`dot-${slide.src}`}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    aria-label={`View product ${index + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${index === activeSlide ? 'w-6 bg-white/95 shadow-[0_0_0_1px_rgba(31,44,35,0.14)]' : 'w-2.5 bg-white/55 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            )}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/45 bg-[rgba(255,252,245,0.82)] backdrop-blur-sm px-4 py-1.5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-text-secondary whitespace-nowrap">ISO & GMP Certified</p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
