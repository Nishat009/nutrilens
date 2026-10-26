'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ScanLine,
  BookOpen,
  Carrot,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Eye,
} from 'lucide-react';
import { cn } from '../../lib/utils/format';
import { APP_NAME } from '../../lib/constants';
import { useAuthStore } from '../../lib/stores/auth-store';

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Members', icon: Users },
  { href: '/admin/scans', label: 'AI Scan Activity', icon: ScanLine },
  { href: '/admin/diets', label: 'Diet Protocols', icon: BookOpen },
  { href: '/admin/catalog', label: 'Food Catalogue', icon: Carrot },
];

function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      <div className="space-y-8">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              {APP_NAME}
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Admin
              </span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Platform Control Center</p>
          </div>
        </Link>

        <nav className="space-y-1.5" aria-label="Admin">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group border',
                  isActive
                    ? 'bg-purple-500/15 text-purple-200 font-semibold border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border-transparent'
                )}
              >
                <Icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', isActive ? 'text-purple-300' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        {user?.isDemo && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
              <Eye className="w-4 h-4" /> Read-only demo
            </div>
            Browse everything freely. Changes such as deleting members are disabled on the shared demo admin.
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900/80 border border-slate-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();
  const current = adminNavItems.find((item) => pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href)));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="hidden lg:flex flex-col w-72 bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800/80 p-6 fixed inset-y-0 left-0 z-30">
        <AdminSidebarContent />
      </aside>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
          <aside className="relative w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 p-6 z-50 shadow-2xl overflow-y-auto">
            <button
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close admin menu"
              className="absolute top-6 right-4 p-2 rounded-xl text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <AdminSidebarContent onNavigate={() => setIsDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 w-full bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">{current?.label || 'Admin'}</h2>
              <p className="text-xs text-slate-400 hidden sm:block">{APP_NAME} administration</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-400 to-emerald-400 p-0.5">
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-xs font-bold text-purple-200">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
              <div className="text-[10px] text-purple-300 font-medium">{user?.isDemo ? 'Demo administrator' : 'Administrator'}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
