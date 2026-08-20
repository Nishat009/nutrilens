'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Camera,
  UtensilsCrossed,
  BookOpen,
  CalendarDays,
  LineChart,
  User,
  Sparkles,
  Flame,
} from 'lucide-react';
import { cn } from '../../lib/utils/format';
import { APP_NAME } from '../../lib/constants';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan', label: 'AI Food Scanner', icon: Camera, highlight: true },
  { href: '/meals', label: 'Meal History', icon: UtensilsCrossed },
  { href: '/diets', label: 'Diet Explorer', icon: BookOpen },
  { href: '/planner', label: 'Meal Planner', icon: CalendarDays },
  { href: '/progress', label: 'Progress & Trends', icon: LineChart },
  { href: '/profile', label: 'Health Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800/80 p-6 fixed inset-y-0 left-0 z-30 justify-between">
      <div className="space-y-8">
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              {APP_NAME}
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Vision Health Intelligence</p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 shadow-md shadow-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform group-hover:scale-110',
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Daily Streak Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800/90 text-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">12-Day Streak</div>
            <div className="text-[11px] text-slate-400">Consistent tracking</div>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Log 1 more meal today to secure your streak milestone!
        </p>
      </div>
    </aside>
  );
}
