import { useMemo, useRef, useState } from 'react';

// Subtle 3D perspective tilt on hover, following the pointer — same
// mouse-tracking idea as the magnetic hover effect on Button.jsx, applied as
// a rotation instead of a translation. Spread the returned handlers/style
// onto the card element.
export function useTilt({ max = 7, scale = 1.02 } = {}) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  if (prefersReducedMotion) {
    return { ref, style: {}, onMouseMove: () => {}, onMouseLeave: () => {} };
  }

  const onMouseMove = (event) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * max * 2;
    const rotateX = (0.5 - py) * max * 2;

    setStyle({
      transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale}) translateY(-4px)`,
      transition: 'transform 0.15s ease-out',
    });
  };

  const onMouseLeave = () => {
    setStyle({
      transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0)',
      transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
    });
  };

  return { ref, style, onMouseMove, onMouseLeave };
}
