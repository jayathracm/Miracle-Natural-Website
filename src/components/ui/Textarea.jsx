import React from 'react';
import { cn } from '../../lib/utils';
import { inputFieldClasses, labelFieldClasses } from './Input';

export const Textarea = ({
  id,
  label,
  hint,
  error,
  className,
  wrapperClassName,
  rows = 3,
  ...props
}) => (
  <div className={wrapperClassName}>
    {label && (
      <label className={labelFieldClasses} htmlFor={id}>
        {label}
      </label>
    )}
    <textarea id={id} rows={rows} className={cn(inputFieldClasses, 'resize-none', className)} {...props} />
    {hint && <p className="mt-1 text-[0.72rem] text-muted-foreground">{hint}</p>}
    {error && <p className="mt-1 text-[0.72rem] text-red-600">{error}</p>}
  </div>
);
