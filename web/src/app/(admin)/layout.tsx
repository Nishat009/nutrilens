'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '../../components/admin/AdminShell';
import { useAuthStore } from '../../lib/stores/auth-store';

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
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
    if (!hasCheckedAuth || isLoading) return;
    if (!isAuthenticated) router.replace('/login');
    else if (user?.role !== 'admin') router.replace('/dashboard');
  }, [hasCheckedAuth, isAuthenticated, isLoading, user, router]);

  if (!hasCheckedAuth || isLoading || !isAuthenticated || user?.role !== 'admin') return null;
  return <AdminShell>{children}</AdminShell>;
}

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAdmin>{children}</ProtectedAdmin>;
}
