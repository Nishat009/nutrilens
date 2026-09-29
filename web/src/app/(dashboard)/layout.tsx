'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../lib/stores/auth-store';

function ProtectedDashboard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    let active = true;
    checkAuth().finally(() => {
      if (active) setHasCheckedAuth(true);
    });
    return () => { active = false; };
  }, [checkAuth]);

  useEffect(() => {
    if (hasCheckedAuth && !isLoading && !isAuthenticated) router.replace('/login');
  }, [hasCheckedAuth, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (hasCheckedAuth && !isLoading && isAuthenticated && user && !user.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [hasCheckedAuth, isAuthenticated, isLoading, user, router]);

  if (!hasCheckedAuth || isLoading || !isAuthenticated || !user?.onboardingCompleted) return null;
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedDashboard>{children}</ProtectedDashboard>;
}
