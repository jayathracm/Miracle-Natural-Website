import React from 'react';
import { cn } from '../../lib/utils';

// Simple shimmering placeholder block. Compose these to build skeleton
// layouts that mirror the real content's shape, so the page doesn't jump
// around once data arrives.
export const Skeleton = ({ className, rounded = 'rounded-lg', ...props }) => (
  <div className={cn('skeleton', rounded, className)} {...props} />
);

// Mirrors a Shop/Wishlist/AdminProducts product card: image block + a
// couple of text lines + a price line.
export const ProductCardSkeleton = () => (
  <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] overflow-hidden flex flex-col">
    <Skeleton className="aspect-[4/3] w-full" rounded="rounded-none" />
    <div className="p-4 flex flex-col gap-2.5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-5 w-1/3 mt-1" />
    </div>
  </div>
);

// Mirrors a collapsed order/message row in Admin* pages and account sections.
export const RowSkeleton = () => (
  <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-4 py-4 sm:px-5 flex flex-wrap items-center justify-between gap-3">
    <div className="flex-1 min-w-[220px] space-y-2">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-3 w-56" />
    </div>
    <Skeleton className="h-6 w-20" rounded="rounded-full" />
  </div>
);

export const RowSkeletonList = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <RowSkeleton key={i} />
    ))}
  </div>
);

export const ProductGridSkeleton = ({ count = 8, className }) => (
  <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);
