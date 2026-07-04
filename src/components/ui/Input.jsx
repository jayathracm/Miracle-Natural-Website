import React from 'react';
import { cn } from '../../lib/utils';

export const inputFieldClasses =
  "w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

export const labelFieldClasses =
  "mb-1.5 block text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary";

// Shared text input used across checkout, account, and admin forms so the
// field chrome (border, focus ring, label style) stays consistent in one
// place instead of a repeated `inputClasses`/`labelClasses` string per file.
export const Input = ({
  id,
  label,
  hint,
  error,
  className,
  wrapperClassName,
  inputClassName,
  ...props
}) => (
  <div className={wrapperClassName}>
    {label && (
      <label className={labelFieldClasses} htmlFor={id}>
        {label}
      </label>
    )}
    <input id={id} className={cn(inputFieldClasses, className, inputClassName)} {...props} />
    {hint && <p className="mt-1 text-[0.72rem] text-muted-foreground">{hint}</p>}
    {error && <p className="mt-1 text-[0.72rem] text-red-600">{error}</p>}
  </div>
);
