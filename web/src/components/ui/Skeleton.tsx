'use client';

import React from 'react';
import { cn } from '../../lib/utils/format';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export function Skeleton({ className, variant = 'rectangular', ...props }: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'h-36 w-full rounded-2xl',
  };

  return (
    <div
      className={cn('animate-pulse bg-slate-800/80 border border-slate-700/30', variantStyles[variant], className)}
      {...props}
    />
  );
}
