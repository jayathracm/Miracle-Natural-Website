import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

// A slim fixed bar that fills left-to-right as the page is scrolled —
// sits above the navbar (which is z-50) so it's always visible as a
// constant, gentle sense of progress through the page.
const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[linear-gradient(90deg,var(--color-primary),var(--color-secondary),var(--color-accent))]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
};

export default ScrollProgressBar;
