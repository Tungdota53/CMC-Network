'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * AuthProvider — đặt ở root layout.
 * Khi app load lần đầu, nếu có token trong localStorage → gọi /users/me để refresh user state.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const userId = useAuthStore((state) => state.user?.id);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const markSessionVerified = useAuthStore((state) => state.markSessionVerified);

  useEffect(() => {
    if (!hasHydrated) return;
    if (userId) {
      refreshUser();
    } else {
      markSessionVerified();
    }
  }, [refreshUser, userId, hasHydrated, markSessionVerified]);

  return <>{children}</>;
}
