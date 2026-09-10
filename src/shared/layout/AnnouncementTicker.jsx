import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { shopPathForBrand } from '@/shared/lib/brands';

// Site-wide scrolling announcement strip above the nav. Set to null to turn
// it off entirely; update the fields (and `id`, so a dismissal of the old
// message doesn't suppress the new one) for the next announcement.
const TICKER = {
  id: 'bright-blossom-launch-2026-09',
  message: 'New Arrival — Bright Blossom is here. Brightening botanical essentials for every day.',
  ctaLabel: 'Shop Now',
  ctaLink: `${shopPathForBrand('miracle_natural')}?q=Blossom`,
};

const DISMISSED_KEY = 'mn-ticker-dismissed';
// How fast the marquee moves, independent of message length or screen size.
const SCROLL_SPEED_PX_PER_SEC = 90;

const AnnouncementTicker = () => {
  const navigate = useNavigate();
  // Starts hidden so there's no flash-then-hide if the visitor already
  // dismissed it — flips true only once we've confirmed it hasn't been.
  const [isVisible, setIsVisible] = useState(false);
  const trackRef = useRef(null);
  // How many times the message repeats per loop, and how long one loop
  // takes. Both are measured, not guessed — a fixed "2 copies" only reads
  // as continuous when the message happens to be wide enough to fill the
  // screen; on a short message + wide screen it leaves a visible blank
  // stretch after the text scrolls past. Repeating until one group's width
  // safely exceeds the viewport removes that gap at any screen size.
  const [repeat, setRepeat] = useState(2);
  const [duration, setDuration] = useState(18);

  useEffect(() => {
    if (!TICKER) return;
    try {
      setIsVisible(window.localStorage.getItem(DISMISSED_KEY) !== TICKER.id);
    } catch {
      // Storage unavailable (private browsing, etc.) — default to showing it.
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!TICKER || !isVisible) return undefined;

    const measure = () => {
      const singleWidth = trackRef.current?.offsetWidth;
      if (!singleWidth) return;
      const nextRepeat = Math.max(2, Math.ceil(window.innerWidth / singleWidth) + 1);
      setRepeat(nextRepeat);
      setDuration((nextRepeat * singleWidth) / SCROLL_SPEED_PX_PER_SEC);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isVisible]);

  if (!TICKER || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, TICKER.id);
    } catch {
      // Dismissal just won't persist — not worth failing over.
    }
  };

  // A single copy of the message + CTA. Rendered `repeat` times per group,
  // two identical groups back-to-back, so the -50% translateX loop is
  // seamless — every visible copy is real, clickable content, not a
  // decorative duplicate.
  const track = (isFirst) => (
    <div className="flex shrink-0 items-center" ref={isFirst ? trackRef : undefined}>
      <span className="mx-6 whitespace-nowrap">{TICKER.message}</span>
      <button
        type="button"
        onClick={() => navigate(TICKER.ctaLink)}
        className="mx-2 inline-flex items-center rounded-full border border-white/40 px-2.5 py-0.5 text-[0.66rem] font-bold uppercase tracking-[0.08em] transition-colors hover:bg-white/10"
      >
        {TICKER.ctaLabel}
      </button>
    </div>
  );

  return (
    <div className="relative flex h-8 items-center overflow-hidden bg-primary text-[0.72rem] font-semibold text-primary-foreground sm:h-9 sm:text-[0.76rem]">
      <div className="flex animate-ticker-scroll" style={{ animationDuration: `${duration}s` }}>
        <div className="flex shrink-0">
          {Array.from({ length: repeat }).map((_, i) => (
            <React.Fragment key={`a-${i}`}>{track(i === 0)}</React.Fragment>
          ))}
        </div>
        <div className="flex shrink-0">
          {Array.from({ length: repeat }).map((_, i) => (
            <React.Fragment key={`b-${i}`}>{track(false)}</React.Fragment>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-8 w-10 bg-gradient-to-l from-primary to-transparent sm:right-9" />
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground sm:right-2.5"
      >
        <X size={13} />
      </button>
    </div>
  );
};

export default AnnouncementTicker;
