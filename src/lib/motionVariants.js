// Shared Framer Motion variants for scroll-triggered reveals. Using one
// definition everywhere keeps the "feel" of the scroll consistent across
// sections instead of every section inventing its own timing/easing.

// Apply to the parent (grid/list) with initial="hidden" whileInView="visible".
export const staggerContainer = (staggerChildren = 0.08) => ({
  hidden: {},
  visible: { transition: { staggerChildren } },
});

// Apply to each child with variants={fadeUpItem}.
// Opacity and position deliberately use different easing: the snappy
// expo-out curve on `y` gives a nice quick "settle," but the same curve on
// `opacity` shoots straight to ~100% almost immediately — against this
// site's cream/white palette that reads as a "blink to white" flash rather
// than a fade. Opacity gets a plain, even easeOut across the full duration
// instead.
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

// Slightly larger rise + longer duration, for single "hero" elements (a
// section's intro box, a CTA card) rather than grid items.
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
