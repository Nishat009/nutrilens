'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Sparkles, Smartphone, ShieldCheck, Copy, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { useAuthStore } from '../../../lib/stores/auth-store';
import { APP_NAME, DEMO_LOGINS, DEMO_MODE_ENABLED } from '../../../lib/constants';
import { UserProfile } from '../../../lib/types';

type DemoLogin = (typeof DEMO_LOGINS)[number];

const destinationFor = (user: UserProfile | null) => {
  if (user?.role === 'admin') return '/admin';
  return user?.onboardingCompleted ? '/dashboard' : '/onboarding';
};

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="group flex w-full items-center justify-between gap-2 rounded-lg bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 text-left font-mono text-[11px] text-slate-300 hover:border-slate-700 transition-colors cursor-pointer"
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-slate-300" />
      )}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<DemoLogin['role'] | null>(null);
  const [error, setError] = useState('');

  const signIn = async (signInEmail: string, signInPassword: string) => {
    await login(signInEmail, signInPassword);
    router.push(destinationFor(useAuthStore.getState().user));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demo: DemoLogin) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setDemoLoading(demo.role);
    setError('');

    try {
      await signIn(demo.email, demo.password);
    } catch {
      setError('The demo server is waking up or unreachable. Please try again in a few seconds.');
      setDemoLoading(null);
    }
  };

  const isBusy = isLoading || demoLoading !== null;

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
        <div role="alert" className="p-3.5 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {DEMO_MODE_ENABLED && (
        <section aria-labelledby="demo-heading" className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 id="demo-heading" className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              One-click live demo
            </h2>
            <span className="text-[11px] text-slate-500">Pick a role</span>
          </div>

          <div className="space-y-3">
            {DEMO_LOGINS.map((demo) => {
              const Icon = demo.role === 'admin' ? ShieldCheck : Smartphone;
              return (
                <div key={demo.role} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={
                          demo.role === 'admin'
                            ? 'p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white">{demo.label}</div>
                        <p className="text-[11px] leading-snug text-slate-400">{demo.description}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={demo.role === 'admin' ? 'secondary' : 'glow'}
                      size="sm"
                      className="shrink-0 py-2"
                      isLoading={demoLoading === demo.role}
                      disabled={isBusy}
                      onClick={() => handleDemoLogin(demo)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {demo.role === 'admin' ? 'Log in as Admin' : 'Log in as Member'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-1.5">
                    <CopyValue value={demo.email} label={`${demo.label} email`} />
                    <CopyValue value={demo.password} label={`${demo.label} password`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-8">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[11px] uppercase tracking-wider text-slate-500">or sign in with your account</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
        </section>
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
          disabled={isBusy}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-8 text-center text-xs text-slate-400">
        Don&apos;t have an account yet?{' '}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline">
          Create one now
        </Link>
      </div>
    </Card>
  );
}
