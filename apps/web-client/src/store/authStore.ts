import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';
import { User } from '@/types/user';
import { ApiResponse } from '@/types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1] || '';
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return JSON.parse(atob(padded));
}

function setAuthCookies(accessToken: string, refreshToken?: string | null) {
  document.cookie = `auth_token=${accessToken}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Lax`;
  if (refreshToken) {
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${REFRESH_TOKEN_MAX_AGE}; SameSite=Lax`;
  }
}

function clearAuthStorage() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post(
            '/auth/login',
            { identifier: email, password },
          );
          const payload = response.data?.data ?? response.data;
          const accessToken = payload.accessToken ?? payload.access_token;
          const refreshToken = payload.refreshToken ?? payload.refresh_token;
          const { user } = payload;
          if (!accessToken || !user) throw new Error('Invalid login response');
          localStorage.setItem('auth_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
          }
          setAuthCookies(accessToken, refreshToken);
          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        clearAuthStorage();
        set({ user: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        try {
          let token = localStorage.getItem('auth_token');
          const refreshToken = localStorage.getItem('refresh_token');
          if (!token && !refreshToken) throw new Error('No token');

          const shouldRefresh = !token || (() => {
            try {
              const payload = decodeJwtPayload(token);
              return !!payload.exp && payload.exp * 1000 <= Date.now() + 30_000;
            } catch {
              return true;
            }
          })();

          if (shouldRefresh) {
            if (!refreshToken) throw new Error('Token expired');
            const refreshed = await api.post('/auth/refresh', { refreshToken });
            const nextAccessToken = refreshed.data?.data?.accessToken || refreshed.data?.data?.access_token;
            const nextRefreshToken = refreshed.data?.data?.refreshToken || refreshed.data?.data?.refresh_token;
            if (!nextAccessToken) throw new Error('Refresh failed');
            localStorage.setItem('auth_token', nextAccessToken);
            if (nextRefreshToken) localStorage.setItem('refresh_token', nextRefreshToken);
            setAuthCookies(nextAccessToken, nextRefreshToken || refreshToken);
            token = nextAccessToken;
          } else if (token) {
            setAuthCookies(token, refreshToken);
          }

          const response = await api.get('/users/me');
          set({ user: response.data.data, isAuthenticated: true });
        } catch {
          clearAuthStorage();
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'cc-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setUser(state.user);
        useAuthStore.setState({ hasHydrated: true });
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
