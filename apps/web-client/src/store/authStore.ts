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
  hasVerifiedSession: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  markSessionVerified: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      hasVerifiedSession: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post(
            '/auth/login',
            { identifier: email, password },
          );
          const payload = response.data?.data ?? response.data;
          const { user } = payload;
          if (!user) throw new Error('Invalid login response');
          set({ user, isAuthenticated: true, hasVerifiedSession: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await api.post('/auth/logout').catch(() => undefined);
        set({ user: null, isAuthenticated: false, hasVerifiedSession: true });
      },

      refreshUser: async () => {
        try {
          const response = await api.get('/users/me');
          set({ user: response.data.data, isAuthenticated: true, hasVerifiedSession: true });
        } catch {
          set({ user: null, isAuthenticated: false, hasVerifiedSession: true });
          if (typeof window !== 'undefined') localStorage.removeItem('cc-auth');
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      markSessionVerified: () => set({ hasVerifiedSession: true }),
    }),
    {
      name: 'cc-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          state.setUser(state.user);
        }
        useAuthStore.setState({ hasHydrated: true });
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
