'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PlayCircle } from 'lucide-react';
import { useAuthStore } from '../../lib/stores/auth-store';

interface DemoButtonProps {
  className?: string;
  children: React.ReactNode;
}

// Signs in as the seeded demo user and drops the visitor straight into the app.
export function DemoButton({ className, children }: DemoButtonProps) {
  const router = useRouter();
  const demoLogin = useAuthStore((state) => state.demoLogin);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setIsLoading(true);
    setError('');
    try {
      await demoLogin('user');
      router.push(useAuthStore.getState().user?.onboardingCompleted ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center lg:items-start gap-2">
      <button type="button" onClick={handleClick} disabled={isLoading} className={`${className ?? ''} disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer`}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <PlayCircle className="w-4 h-4" aria-hidden="true" />}
        {isLoading ? 'Opening demo…' : children}
      </button>
      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
