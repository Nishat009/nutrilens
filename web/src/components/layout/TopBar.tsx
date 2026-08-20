'use client';

import React from 'react';
import Link from 'next/link';
import { useUserStore } from '../../lib/stores/user-store';
import { getGreeting } from '../../lib/utils/format';
import { Bell, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export function TopBar() {
  const { profile } = useUserStore();
  const greeting = getGreeting(profile?.name?.split(' ')[0]);

  return (
    <header className="sticky top-0 z-20 w-full bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{greeting} 👋</h2>
          <p className="text-xs text-slate-400 hidden sm:block">
            Targeting fat loss & high protein adherence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/scan">
          <Button variant="glow" size="sm" className="hidden sm:inline-flex gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Scan Food</span>
          </Button>
        </Link>

        {/* Notifications Icon */}
        <button
          aria-label="View notifications"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 bg-slate-900/80 border border-slate-800 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
        </button>

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
