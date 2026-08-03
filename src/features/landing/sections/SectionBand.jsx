import React from 'react';

// Groups a few related sections into one visually distinct "chapter" —
// a soft forest-tinted wash with hairline borders top and bottom — so the
// homepage reads as a sequence of deliberate chapters while scrolling
// instead of one continuous, undifferentiated stack of sections.
const SectionBand = ({ children }) => (
  <div
    className="relative border-t border-b border-[var(--color-border-light)]"
    style={{
      background:
        'linear-gradient(180deg, rgba(79,113,84,0.055), rgba(79,113,84,0.016) 45%, rgba(79,113,84,0.016) 55%, rgba(79,113,84,0.055))',
    }}
  >
    {children}
  </div>
);

export default SectionBand;
