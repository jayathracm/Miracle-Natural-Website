import React from 'react';
import brandLogoMainImg from '../assets/branding-from-pdf/miracle-natural-logo-main-transparent.png';
import { Typography } from './ui/Typography';

const AuthLayout = ({ eyebrow, title, subtitle, children }) => {
  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <img
            src={brandLogoMainImg}
            alt="Miracle Natural"
            className="h-14 w-auto object-contain"
          />
        </div>

        <div className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.94))] p-6 sm:p-8 shadow-[0_20px_42px_rgba(31,44,35,0.1)]">
          {eyebrow && (
            <Typography variant="label" className="mb-2 block text-center">
              {eyebrow}
            </Typography>
          )}
          <Typography variant="h3" className="mb-2 text-center text-foreground">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="small" className="mb-6 block text-center">
              {subtitle}
            </Typography>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
