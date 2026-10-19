"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export default function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowedAdminEmails = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS || '';
    return raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  const hasEmailAllow = !!user?.email && allowedAdminEmails.includes(user.email.toLowerCase());
  const hasRoleAllow = user?.role === 'admin';
  const isAllowed = hasRoleAllow || hasEmailAllow;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isAllowed) {
      router.replace('/tenant-admin');
    }
  }, [loading, user, isAllowed, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Validando acceso...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}
