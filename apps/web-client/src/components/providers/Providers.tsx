'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './AuthProvider';
import { useUiStore } from '@/store/uiStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 phút
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const { theme, compactMode } = useUiStore();

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      root.classList.remove('light', 'dark');
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
        root.style.colorScheme = systemTheme;
      } else {
        root.classList.add(theme);
        root.style.colorScheme = theme;
      }
    };

    applyTheme();

    if (theme === 'system') {
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Apply compact mode class
  useEffect(() => {
    const root = document.documentElement;
    if (compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [compactMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3200,
            className: 'rounded-2xl border border-border bg-card text-foreground shadow-2xl',
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
