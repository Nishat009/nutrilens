'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../lib/stores/auth-store';

function ProtectedDashboard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedDashboard>{children}</ProtectedDashboard>;
}
