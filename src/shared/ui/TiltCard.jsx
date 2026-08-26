import React from 'react';
import { useTilt } from '@/shared/hooks/useTilt';

// Wraps card content with a pointer-tracking 3D tilt. Its own component so
// the hook is called consistently per card, not conditionally in a loop.
export const TiltCard = ({ as: Component = 'div', className, style, children, ...props }) => {
  const { ref, style: tiltStyle, onMouseMove, onMouseLeave } = useTilt();

  return (
    <Component
      ref={ref}
      className={className}
      style={{ ...style, ...tiltStyle, willChange: 'transform' }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </Component>
  );
};
