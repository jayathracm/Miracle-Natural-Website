import React from 'react';
import { useTilt } from '../../hooks/useTilt';

// Wraps card content with a subtle pointer-tracking 3D tilt. Kept as its own
// component (rather than calling useTilt directly in a .map()) so the hook
// is called consistently per card instance, not conditionally inside a loop.
// eslint-disable-next-line no-unused-vars -- Component is used via JSX (<Component>)
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
