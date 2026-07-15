import { create } from 'zustand';
import api from '@/lib/api';

const hasAuthToken = () =>
  typeof window !== 'undefined' && !!localStorage.getItem('auth_token');

interface Notification {
  id: string;
  title: string;
  content?: string;
  type: string;
  isRead: boolean;
  timeAgo: string;
  avatarUrl?: string;
  actionUrl?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  fetchNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications) => set({ notifications }),
  
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),

  markAsRead: async (id) => {
    if (!hasAuthToken()) return;
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (e) {
      console.error(e);
    }
  },

  markAllAsRead: async () => {
    if (!hasAuthToken()) return;
    try {
      await api.put(`/notifications/read-all`);
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (e) {
      console.error(e);
    }
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  fetchNotifications: async () => {
    if (!hasAuthToken()) {
      set({ notifications: [], unreadCount: 0, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await api.get('/notifications');
      const data = res.data.data || [];
      
      const mapped = data.map((n: any) => {
        let timeAgoStr = '';
        if (n.createdAt) {
          const diff = Date.now() - new Date(n.createdAt).getTime();
          if (diff < 60000) timeAgoStr = 'Vài giây trước';
          else if (diff < 3600000) timeAgoStr = `${Math.floor(diff/60000)} phút trước`;
          else if (diff < 86400000) timeAgoStr = `${Math.floor(diff/3600000)} giờ trước`;
          else timeAgoStr = `${Math.floor(diff/86400000)} ngày trước`;
        }
        
        return {
          id: n.id,
          title: n.title || n.message || 'Thông báo',
          content: n.content || n.message,
          type: n.type,
          isRead: n.isRead,
          timeAgo: timeAgoStr,
          avatarUrl: n.sender?.avatarUrl,
          actionUrl: n.actionUrl || (n.type === 'FRIEND_REQUEST' ? '/friends' : '#')
        };
      });
      
      set({ notifications: mapped, unreadCount: mapped.filter((n: any) => !n.isRead).length, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
      set({ isLoading: false });
    }
  }
}));
