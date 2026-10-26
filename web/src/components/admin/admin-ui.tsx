'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils/format';
import { GOAL_OPTIONS } from '../../lib/constants';
import { GoalType } from '../../lib/types';

const ACRONYMS = new Set(['pcos', 'pms', 'pmdd', 'gerd', 'ibs', 'ckd', 'nafld', 'dash']);

export const humanize = (value?: string | null) =>
  (value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => (ACRONYMS.has(word.toLowerCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');

export const goalLabel = (goal?: string | null) =>
  (goal && GOAL_OPTIONS[goal as GoalType]?.label) || humanize(goal) || '—';

export const shortDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const percent = (value?: number | null) => (value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`);

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">{description}</p>
      </div>
      {actions}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  accent = 'emerald',
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  accent?: 'emerald' | 'purple' | 'amber' | 'blue' | 'rose';
}) {
  const accents = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={cn('p-2 rounded-xl border', accents[accent])}>{icon}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}

// Horizontal bar list: label, count and a single-hue bar scaled to the largest value.
export function BarList({ rows, emptyText }: { rows: { label: string; value: number }[]; emptyText: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) return <p className="text-xs text-slate-500 py-6 text-center">{emptyText}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
            <span className="text-slate-200 font-medium truncate">{row.label}</span>
            <span className="text-slate-400 tabular-nums">{row.value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-xs text-slate-400">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="p-2 rounded-xl border border-slate-800 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className="p-2 rounded-xl border border-slate-800 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className={cn('w-9 h-9 shrink-0 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-300', className)}>
      {initials || '?'}
    </div>
  );
}

export function ConfidencePill({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="text-slate-500">—</span>;
  const tone =
    value >= 0.85
      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
      : value >= 0.7
        ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
        : 'text-rose-300 bg-rose-500/10 border-rose-500/30';
  return <span className={cn('px-1.5 py-0.5 rounded-md border text-[10px] font-semibold tabular-nums', tone)}>{percent(value)}</span>;
}
