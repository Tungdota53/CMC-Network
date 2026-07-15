'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * AuthProvider — đặt ở root layout.
 * Khi app load lần đầu, nếu có token trong localStorage → gọi /users/me để refresh user state.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshUser, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if ((token || refreshToken) && (!isAuthenticated || !user)) {
      refreshUser();
    }
  }, [refreshUser, isAuthenticated, user]);

  return <>{children}</>;
}
