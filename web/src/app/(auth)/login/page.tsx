'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Sparkles, UserRound, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { useAuthStore } from '../../../lib/stores/auth-store';
import { APP_NAME } from '../../../lib/constants';

// One-click demo sign-in for showcase deployments (the API needs DEMO_MODE=true as well).
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const DEMO_ROLES = [
  { role: 'user', label: 'Demo User', desc: 'Scanner, meals, planner, progress', icon: UserRound },
  { role: 'admin', label: 'Demo Admin', desc: 'Admin panel + food catalogue', icon: ShieldCheck },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { login, demoLogin } = useAuthStore();
  const [demoRole, setDemoRole] = useState<'user' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      const destination = useAuthStore.getState().user?.onboardingCompleted
        ? '/dashboard'
        : '/onboarding';
      router.push(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'user' | 'admin') => {
    setDemoRole(role);
    setError('');

    try {
      await demoLogin(role);
      const user = useAuthStore.getState().user;
      router.push(role === 'admin' && user?.isAdmin ? '/admin' : user?.onboardingCompleted ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed. Please try again.');
    } finally {
      setDemoRole(null);
    }
  };

  return (
    <Card variant="glass" className="p-8 sm:p-10 border-slate-800 shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex lg:hidden items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mb-4 shadow-lg shadow-emerald-500/25">
          <Sparkles className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome Back</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Sign in to your {APP_NAME} health workspace
        </p>
      </div>

      {error && (
        <div className="p-3.5 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="glow"
          size="lg"
          className="w-full mt-4"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      {DEMO_MODE && (
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            Try the live demo — no sign-up
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_ROLES.map(({ role, label, desc, icon: Icon }) => (
              <button
                key={role}
                type="button"
                disabled={demoRole !== null || isLoading}
                onClick={() => handleDemoLogin(role)}
                className="flex flex-col items-start gap-1 px-4 py-3 rounded-xl text-left bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  {demoRole === role ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <Icon className="w-4 h-4 text-emerald-400" />
                  )}
                  {label}
                </span>
                <span className="text-[11px] text-slate-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-slate-400">
        Don&apos;t have an account yet?{' '}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline">
          Create one now
        </Link>
      </div>
    </Card>
  );
}
