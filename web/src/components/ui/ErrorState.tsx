'use client';

import React from 'react';
import { cn } from '../../lib/utils/format';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-rose-950/20 border border-rose-900/40 text-slate-100',
        className
      )}
    >
      <div className="p-3 rounded-2xl bg-rose-900/30 text-rose-400 mb-3 border border-rose-800/50">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-rose-200">{title}</h4>
      <p className="text-xs text-rose-300/80 max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-rose-800 text-rose-200 hover:bg-rose-900/40">
          Try Again
        </Button>
      )}
    </div>
  );
}
