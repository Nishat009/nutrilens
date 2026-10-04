'use client';

import React from 'react';
import Link from 'next/link';
import { useUserStore } from '../../lib/stores/user-store';
import { getGreeting } from '../../lib/utils/format';
import { Sparkles, Menu } from 'lucide-react';
import { Button } from '../ui/Button';

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Lose weight',
  reduce_belly_fat: 'Reduce belly fat',
  gain_muscle: 'Build muscle',
  body_recomposition: 'Body recomposition',
  maintain: 'Maintain weight',
  general_health: 'General health',
  blood_sugar: 'Blood sugar management',
  blood_pressure: 'Blood pressure support',
};

interface TopBarProps {
  onOpenSidebar?: () => void;
}

export function TopBar({ onOpenSidebar }: TopBarProps) {
  const { profile, goal, isLoaded } = useUserStore();
  const greeting = getGreeting(profile?.name?.split(' ')[0]);
  const goalLabel = isLoaded ? GOAL_LABELS[goal.type] : undefined;

  return (
    <header className="sticky top-0 z-20 w-full bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Trigger */}
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            aria-label="Open sidebar menu"
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{greeting} 👋</h2>
          {goalLabel && (
            <p className="text-xs text-slate-400 hidden sm:block">Goal: {goalLabel}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/scan">
          <Button variant="glow" size="sm" className="hidden sm:inline-flex gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Scan Food</span>
          </Button>
        </Link>

        {/* Profile Avatar */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 pl-2 border-l border-slate-800 hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5 shadow-md shadow-emerald-500/20">
            <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-xs font-bold text-emerald-400">
              {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'NL'}
            </div>
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">{profile.name}</div>
            <div className="text-[10px] text-emerald-400 font-medium">Active Member</div>
          </div>
        </Link>
      </div>
    </header>
  );
}
