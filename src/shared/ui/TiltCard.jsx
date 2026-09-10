import React from 'react';
import { useTilt } from '@/shared/hooks/useTilt';

// Wraps card content with a pointer-tracking 3D tilt. Its own component so
// the hook is called consistently per card, not conditionally in a loop.
// `tiltOptions` forwards to useTilt (e.g. { max, scale }) for callers that
// want a stronger/weaker effect than the default.
export const TiltCard = ({ as: Component = 'div', className, style, tiltOptions, children, ...props }) => {
  const { ref, style: tiltStyle, onMouseMove, onMouseLeave } = useTilt(tiltOptions);

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
