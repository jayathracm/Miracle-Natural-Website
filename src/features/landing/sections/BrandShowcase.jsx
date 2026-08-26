import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/utils';
import miracleNaturalIcon from '@/assets/branding-from-pdf/miracle-natural-logo-icon-transparent.png';
import lairaWordmark from '@/assets/branding/laira-wordmark-transparent.png';

// Mode-select style panels — equal width at rest, the hovered/tapped one
// expands and sharpens while the other shrinks and blurs. One tile per
// consumer-facing sub-brand (Leora Wellness itself has no shop, so it's
// not a tile).
const TILES = [
  {
    brand: 'miracle_natural',
    label: 'Miracle Natural',
    badge: null,
    description: 'Herbal-based personal care for everyday rituals — face, body, hair, and lip care, made accessible without compromising on quality.',
    icon: miracleNaturalIcon,
    iconClassName: 'h-11 sm:h-12',
    bgIcon: Leaf,
    to: '/miracle-natural',
    ctaLabel: 'Explore Brand',
    gradient: 'linear-gradient(165deg, #3f5a49 0%, #223026 100%)',
  },
  {
    brand: 'laira',
    label: 'Laira',
    badge: 'Coming Soon',
    description: "A new wellness line from Leora Wellness is taking shape. The full experience lands here soon.",
    icon: lairaWordmark,
    iconClassName: 'h-6 sm:h-7 brightness-0 invert',
    bgIcon: Sparkles,
    to: '/laira',
    ctaLabel: 'Preview Laira',
    gradient: 'linear-gradient(165deg, #40403e 0%, #1c1c1c 100%)',
  },
];

const ICON_SPRING = { type: 'spring', stiffness: 110, damping: 14 };
const CONTENT_SPRING = { type: 'spring', stiffness: 280, damping: 26 };

const BrandTile = ({ tile, isActive, isDimmed, onHoverStart, onToggle, navigate }) => {
  // Cursor-tracked spotlight + parallax on the expanded panel.
  const [spot, setSpot] = useState({ x: 50, y: 50 });

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSpot({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const parallaxX = isActive ? (spot.x - 50) * 0.22 : 0;
  const parallaxY = isActive ? (spot.y - 50) * 0.22 : 0;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onMouseEnter={onHoverStart}
      onMouseMove={handleMouseMove}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onToggle();
      }}
      aria-pressed={isActive}
      aria-label={`${tile.label}${isActive ? ' (expanded)' : ''}`}
      className="group relative h-full min-w-0 flex-1 cursor-pointer overflow-hidden border-r border-white/10 outline-none transition-[filter] duration-500 ease-out last:border-r-0 focus-visible:ring-2 focus-visible:ring-white/60"
      style={{ flexBasis: 0, filter: isDimmed ? 'brightness(0.55) blur(1.5px)' : 'brightness(1) blur(0px)' }}
    >
      <div
        className="absolute inset-0 transition-[filter] duration-500 ease-out"
        style={{ background: tile.gradient }}
      />

      {/* Cursor-follow spotlight, expanded tile only. */}
      {isActive && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{ background: `radial-gradient(420px circle at ${spot.x}% ${spot.y}%, rgba(255,255,255,0.16), transparent 60%)` }}
        />
      )}

      {/* Background icon "unfurls" toward the cursor on hover. */}
      <div className="pointer-events-none absolute inset-x-0 top-[6%] bottom-[38%] flex items-center justify-center">
        <motion.div
          animate={{ x: parallaxX, y: parallaxY, rotate: isActive ? 0 : -10, scale: isActive ? 1.06 : 1 }}
          transition={ICON_SPRING}
        >
          <tile.bgIcon
            aria-hidden="true"
            strokeWidth={1}
            className={cn(
              'text-cream-50 opacity-[0.12] transition-[height,width,opacity] duration-500',
              isActive ? 'h-56 w-56 sm:h-64 sm:w-64' : 'h-32 w-32 sm:h-40 sm:w-40'
            )}
          />
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-7 md:p-9">
        <img src={tile.icon} alt="" aria-hidden="true" className={cn('mb-3 w-auto object-contain', tile.iconClassName)} />

        {/* Icon-only below sm — full labels don't fit in the mobile three-way split. */}
        <p className="hidden sm:block text-[0.95rem] md:text-[1.05rem] font-bold uppercase tracking-[0.14em] text-white whitespace-nowrap">
          {tile.label}
        </p>

        <AnimatePresence>
          {isActive && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={CONTENT_SPRING}
              className="mt-3"
            >
              {tile.badge && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...CONTENT_SPRING, delay: 0.05 }}
                  className="mb-2.5 inline-flex rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white/90"
                >
                  {tile.badge}
                </motion.span>
              )}
              <p className="mb-4 max-w-sm text-[0.85rem] sm:text-[0.9rem] leading-relaxed text-white/80">
                {tile.description}
              </p>
              <Button
                icon={ArrowRight}
                className="px-5 py-2.5 text-[0.72rem]"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(tile.to);
                }}
              >
                {tile.ctaLabel}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const BrandShowcase = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [hoveredBrand, setHoveredBrand] = useState(null);
  const [pinnedBrand, setPinnedBrand] = useState(null);

  const activeBrand = hoveredBrand || pinnedBrand;

  // Tapping outside the showcase collapses everything back to resting state.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setPinnedBrand(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleTileClick = (brand) => {
    setPinnedBrand((prev) => (prev === brand ? null : brand));
  };

  return (
    <section id="our-brands" className="py-10 sm:py-12 md:py-14">
      <div className="px-4 sm:px-6 lg:px-8 text-center mb-8 sm:mb-10">
        <p className="mb-3 font-sans text-[0.72rem] sm:text-[0.75rem] font-bold tracking-[0.22em] uppercase text-accent">Our Brands</p>
        <h2 className="font-display text-[1.95rem] sm:text-[2.4rem] md:text-[3rem] font-normal leading-[1.08] text-foreground text-balance">
          Two storefronts, one standard of care.
        </h2>
      </div>

      {/* Full-bleed: breaks out of the page's max-width container. */}
      <div
        ref={containerRef}
        onMouseLeave={() => setHoveredBrand(null)}
        className="relative left-1/2 w-screen -translate-x-1/2 flex h-[460px] sm:h-[520px] md:h-[580px] overflow-hidden"
      >
        {TILES.map((tile) => {
          const isActive = activeBrand === tile.brand;
          // Only dim a tile once another one is active.
          const isDimmed = activeBrand !== null && !isActive;
          return (
            <BrandTile
              key={tile.brand}
              tile={tile}
              isActive={isActive}
              isDimmed={isDimmed}
              onHoverStart={() => setHoveredBrand(tile.brand)}
              onToggle={() => handleTileClick(tile.brand)}
              navigate={navigate}
            />
          );
        })}
      </div>
    </section>
  );
};

export default BrandShowcase;
