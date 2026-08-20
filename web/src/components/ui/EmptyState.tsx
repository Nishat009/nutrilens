'use client';

import React from 'react';
import { cn } from '../../lib/utils/format';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800',
        className
      )}
    >
      <div className="p-4 rounded-2xl bg-slate-800/80 text-emerald-400 mb-4 border border-slate-700/50 shadow-inner">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-white tracking-tight">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
