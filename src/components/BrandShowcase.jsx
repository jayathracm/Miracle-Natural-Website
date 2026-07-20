import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { shopPathForBrand } from '../lib/brands';
import leoraIcon from '../assets/branding/leora-wellness-icon-transparent.png';
import miracleNaturalIcon from '../assets/branding-from-pdf/miracle-natural-logo-icon-transparent.png';
import lairaWordmark from '../assets/branding/laira-wordmark-transparent.png';

// Modeled on Call of Duty: Modern Warfare's mode-select screen — three
// full-width vertical panels, equal width at rest, where the hovered (or
// tapped) one expands and sharpens while the other two shrink and blur,
// revealing extra detail that isn't shown in the resting state. Miracle
// Natural is the default/"pinned" panel since it's the only storefront with
// real products today (functional-requirements.md §1.9).
const TILES = [
  {
    brand: 'leora_wellness',
    label: 'Leora Wellness',
    badge: 'Coming Soon',
    description: 'Our own direct product line, launching under the Leora Wellness name — details are still being finalized.',
    icon: leoraIcon,
    iconClassName: 'h-9 sm:h-10',
    to: shopPathForBrand('leora_wellness'),
    ctaLabel: 'Preview Shop',
    gradient: 'linear-gradient(165deg, #0d3d38 0%, #071f1c 100%)',
  },
  {
    brand: 'miracle_natural',
    label: 'Miracle Natural',
    badge: null,
    description: 'Herbal-based personal care for everyday rituals — face, body, hair, and lip care, made accessible without compromising on quality.',
    icon: miracleNaturalIcon,
    iconClassName: 'h-11 sm:h-12',
    to: '/miracle-natural',
    ctaLabel: 'Explore Brand',
    gradient: 'linear-gradient(165deg, #223026 0%, #10160f 100%)',
  },
  {
    brand: 'laira',
    label: 'Laira',
    badge: 'Coming Soon',
    description: "A new wellness line from Leora Wellness is taking shape. The full experience lands here soon.",
    icon: lairaWordmark,
    iconClassName: 'h-6 sm:h-7 brightness-0 invert',
    to: '/laira',
    ctaLabel: 'Preview Laira',
    gradient: 'linear-gradient(165deg, #1c1c1c 0%, #050505 100%)',
  },
];

const BrandShowcase = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [hoveredBrand, setHoveredBrand] = useState(null);
  const [pinnedBrand, setPinnedBrand] = useState(null);

  const activeBrand = hoveredBrand || pinnedBrand;

  // Tapping outside the whole showcase (not just off a tile) collapses
  // everything back to the equal-width resting state — the touch equivalent
  // of the mouse simply wandering off the section entirely.
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
    <section className="py-10 sm:py-12 md:py-14">
      <div className="px-4 sm:px-6 lg:px-8 text-center mb-8 sm:mb-10">
        <p className="mb-3 font-sans text-[0.72rem] sm:text-[0.75rem] font-bold tracking-[0.22em] uppercase text-accent">Our Brands</p>
        <h2 className="font-display text-[1.95rem] sm:text-[2.4rem] md:text-[3rem] font-normal leading-[1.08] text-foreground text-balance">
          Three storefronts, one standard of care.
        </h2>
      </div>

      {/* Full-bleed: breaks out of the page's normal max-width container so
          the three panels genuinely span the entire viewport width, edge to
          edge, like the reference UI. */}
      <div
        ref={containerRef}
        onMouseLeave={() => setHoveredBrand(null)}
        className="relative left-1/2 w-screen -translate-x-1/2 flex h-[460px] sm:h-[520px] md:h-[580px] overflow-hidden"
      >
        {TILES.map((tile) => {
          const isActive = activeBrand === tile.brand;
          // Only dim/blur a tile once some *other* tile is active — at rest
          // (nothing hovered/pinned) all three stay fully sharp and equal.
          const isDimmed = activeBrand !== null && !isActive;
          return (
            <div
              key={tile.brand}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoveredBrand(tile.brand)}
              onClick={() => handleTileClick(tile.brand)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') handleTileClick(tile.brand);
              }}
              aria-pressed={isActive}
              aria-label={`${tile.label}${isActive ? ' (expanded)' : ''}`}
              className="group relative h-full min-w-0 cursor-pointer overflow-hidden border-r border-white/10 outline-none last:border-r-0 focus-visible:ring-2 focus-visible:ring-white/60"
              style={{
                flexGrow: isActive ? 3.2 : 1,
                flexBasis: 0,
                filter: isDimmed ? 'brightness(0.55) blur(1.5px)' : 'brightness(1) blur(0px)',
                transition: 'flex-grow 550ms cubic-bezier(0.16,1,0.3,1), filter 550ms ease',
              }}
            >
              <div className="absolute inset-0" style={{ background: tile.gradient }} />

              {/* Oversized faded watermark icon for texture/depth, like the
                  moody background art behind each COD panel. */}
              <img
                src={tile.icon}
                alt=""
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute left-1/2 top-1/2 w-auto -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.08] transition-transform duration-700',
                  isActive ? 'h-64 sm:h-72' : 'h-40 sm:h-48',
                  tile.brand === 'laira' && 'brightness-0 invert'
                )}
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-7 md:p-9">
                <img src={tile.icon} alt="" aria-hidden="true" className={cn('mb-3 w-auto object-contain', tile.iconClassName)} />

                <p className="text-[0.85rem] sm:text-[0.95rem] md:text-[1.05rem] font-bold uppercase tracking-[0.14em] text-white whitespace-nowrap">
                  {tile.label}
                </p>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-500 ease-out',
                    isActive ? 'mt-3 max-h-56 opacity-100' : 'mt-0 max-h-0 opacity-0'
                  )}
                >
                  {tile.badge && (
                    <span className="mb-2.5 inline-flex rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white/90">
                      {tile.badge}
                    </span>
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BrandShowcase;
