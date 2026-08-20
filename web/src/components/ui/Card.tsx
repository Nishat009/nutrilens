'use client';

import React from 'react';
import { cn } from '../../lib/utils/format';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'gradient' | 'bordered';
  isHoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Card({
  className,
  variant = 'glass',
  isHoverable = false,
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10',
  };

  const variantStyles = {
    glass: 'bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-xl shadow-black/20',
    solid: 'bg-slate-900 border border-slate-800 shadow-xl',
    gradient:
      'bg-gradient-to-b from-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl',
    bordered: 'bg-transparent border border-slate-800 hover:border-slate-700',
  };

  return (
    <div
      className={cn(
        'rounded-2xl text-slate-100 transition-all duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        isHoverable &&
          'hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-2xl hover:shadow-emerald-500/5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/60', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold tracking-tight text-white', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs sm:text-sm text-slate-400', className)} {...props}>
      {children}
    </p>
  );
}
