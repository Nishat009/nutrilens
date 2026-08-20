'use client';

import React from 'react';
import { cn } from '../../lib/utils/format';

export interface ProgressBarProps {
  value: number; // current value
  max?: number; // max value
  variant?: 'emerald' | 'purple' | 'amber' | 'rose' | 'blue' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'emerald',
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));

  const sizeStyles = {
    xs: 'h-1.5',
    sm: 'h-2',
    md: 'h-2.5',
    lg: 'h-4 rounded-full',
  };

  const variantStyles = {
    emerald: 'bg-emerald-500 shadow-sm shadow-emerald-500/40',
    purple: 'bg-purple-500 shadow-sm shadow-purple-500/40',
    amber: 'bg-amber-500 shadow-sm shadow-amber-500/40',
    rose: 'bg-rose-500 shadow-sm shadow-rose-500/40',
    blue: 'bg-blue-500 shadow-sm shadow-blue-500/40',
    gradient: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500',
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      <div className={cn('w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>{Math.round(value)}</span>
          <span>{Math.round(max)}</span>
        </div>
      )}
    </div>
  );
}
