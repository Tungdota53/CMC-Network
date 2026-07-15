import { create } from 'zustand';

export interface ChatWindow {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
  isMinimized: boolean;
}

interface ChatState {
  windows: ChatWindow[];
  openChat: (id: string, name: string, avatarUrl?: string, isOnline?: boolean) => void;
  closeChat: (id: string) => void;
  toggleMinimize: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  windows: [],
  openChat: (id, name, avatarUrl, isOnline) => set((state) => {
    // If already open, just make sure it's not minimized
    if (state.windows.some(w => w.id === id)) {
      return {
        windows: state.windows.map(w => w.id === id ? { ...w, name: name || w.name, avatarUrl: avatarUrl ?? w.avatarUrl, isMinimized: false, isOnline: isOnline ?? w.isOnline } : w)
      };
    }
    // Limit to 3 open windows at most (can pop the oldest unminimized if needed, but for now just push)
    const maxWindows = 3;
    let nextWindows = [...state.windows, { id, name, avatarUrl, isOnline, isMinimized: false }];
    if (nextWindows.length > maxWindows) {
      nextWindows = nextWindows.slice(-maxWindows);
    }
    return { windows: nextWindows };
  }),
  closeChat: (id) => set((state) => ({
    windows: state.windows.filter(w => w.id !== id)
  })),
  toggleMinimize: (id) => set((state) => ({
    windows: state.windows.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w)
  }))
}));
