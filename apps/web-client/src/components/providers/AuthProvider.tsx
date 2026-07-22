'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

function getTokenUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded));
    return decoded.sub || decoded.id || null;
  } catch {
    return null;
  }
}

/**
 * AuthProvider — đặt ở root layout.
 * Khi app load lần đầu, nếu có token trong localStorage → gọi /users/me để refresh user state.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const tokenUserId = getTokenUserId(token);
    if ((token || refreshToken) && (!isAuthenticated || !userId || (tokenUserId && tokenUserId !== userId))) {
      refreshUser();
    }
  }, [refreshUser, isAuthenticated, userId]);

  return <>{children}</>;
}
