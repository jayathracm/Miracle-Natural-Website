import React from 'react';

const SectionHeader = ({ children, className = '', size = 'h2' }) => {
  const Tag = size;
  return (
    <div className={`mb-4 sm:mb-5 flex flex-col items-center ${className}`}>
      <Tag className="text-[1.75rem] sm:text-[2.25rem] md:text-[2.75rem] font-semibold text-secondary-950 tracking-tight leading-tight text-center">
        {children}
      </Tag>
      {/* <span className="mt-2 w-12 h-1 rounded-full bg-accent-400 opacity-80" /> */}
    </div>
  );
};

export default SectionHeader;
