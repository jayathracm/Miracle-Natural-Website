import React from 'react';

// Groups a few sections into one tinted "chapter" with hairline borders,
// so the page reads as deliberate chapters while scrolling.
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
