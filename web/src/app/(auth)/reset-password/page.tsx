'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { authApi } from '../../../services/api-client';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token, password);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Invalid Reset Link</h1>
        <p className="text-xs text-slate-400">This link is missing its reset token. Please request a new one.</p>
        <Link href="/forgot-password" className="block pt-2">
          <Button variant="secondary" className="w-full">
            Request a New Link
          </Button>
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">Password Updated</h2>
        <p className="text-xs text-slate-400">You can now sign in with your new password.</p>
        <Link href="/login" className="block pt-4">
          <Button variant="glow" className="w-full">
            Go to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Choose a New Password</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Use at least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />
        <Input
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <Button type="submit" variant="glow" size="lg" className="w-full mt-4" isLoading={isLoading}>
          Update Password
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card variant="glass" className="p-8 sm:p-10 border-slate-800 shadow-2xl">
      {/* useSearchParams needs a Suspense boundary for static rendering */}
      <Suspense fallback={<p className="text-center text-xs text-slate-400">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </Card>
  );
}
