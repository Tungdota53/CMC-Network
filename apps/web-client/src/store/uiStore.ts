import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  try {
    const persisted = JSON.parse(localStorage.getItem('cmc-ui-preferences') || '{}');
    const theme = persisted?.state?.theme;
    if (theme === 'light' || theme === 'dark' || theme === 'system') return theme;

    const legacyTheme = localStorage.getItem('theme');
    if (legacyTheme === 'light' || legacyTheme === 'dark' || legacyTheme === 'system') return legacyTheme;
  } catch {
    // Ignore invalid localStorage and fall back to system.
  }

  return 'system';
}

interface UiState {
  isSidebarOpen: boolean;
  theme: Theme;
  compactMode: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  setCompactMode: (compact: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarOpen: false,
      theme: getInitialTheme(),
      compactMode: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setTheme: (theme) => {
        if (typeof window !== 'undefined') localStorage.setItem('theme', theme);
        set({ theme });
      },
      setCompactMode: (compactMode) => set({ compactMode }),
    }),
    {
      name: 'cmc-ui-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, compactMode: state.compactMode }),
    },
  ),
);
