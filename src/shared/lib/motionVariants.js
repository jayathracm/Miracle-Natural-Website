// Shared Framer Motion variants for scroll-triggered reveals, so every
// section has the same feel instead of reinventing timing/easing.

// Apply to the parent (grid/list) with initial="hidden" whileInView="visible".
export const staggerContainer = (staggerChildren = 0.08) => ({
  hidden: {},
  visible: { transition: { staggerChildren } },
});

// Apply to each child with variants={fadeUpItem}.
// Opacity uses plain easeOut instead of the same curve as y — otherwise it
// flashes to full opacity almost instantly against the cream background.
export const fadeUpItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.55, ease: 'easeOut' },
      y: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  },
};

// Bigger rise + longer duration, for single "hero" elements rather than grid items.
export const fadeUpEmphasis = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      opacity: { duration: 0.7, ease: 'easeOut' },
      y: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
      scale: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  },
};

export const viewportOnce = { once: true, margin: '-80px' };
