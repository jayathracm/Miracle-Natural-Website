import React, { useRef, useState } from 'react';

const Badge = ({ children }) => {
  const badgeRef = useRef(null);
  const [highlight, setHighlight] = useState({ x: 50, y: 50, show: false });

  const handleMouseMove = (e) => {
    const rect = badgeRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHighlight({ x, y, show: true });
  };

  const handleMouseLeave = () => {
    setHighlight((h) => ({ ...h, show: false }));
  };

  return (
    <span
      ref={badgeRef}
      className="inline-block mb-4 px-4 py-1 rounded-full bg-gradient-to-r from-accent-100 to-primary-100 text-[0.95rem] text-primary-700 font-semibold shadow-sm relative overflow-hidden cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      {/* Moving light effect */}
      <span
        className="pointer-events-none absolute left-0 top-0 w-full h-full rounded-full transition-all duration-200"
        style={{
          opacity: highlight.show ? 1 : 0,
          background: `radial-gradient(120px circle at ${highlight.x}% ${highlight.y}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.10) 60%, rgba(255,255,255,0.00) 100%)`,
          transition: 'opacity 0.2s, background 0.15s',
          zIndex: 1,
        }}
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
};

export default Badge;
