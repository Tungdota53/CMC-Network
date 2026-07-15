/**
 * Domain React Query hooks — Notifications
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  friendRequests: boolean;
  system: boolean;
  push: boolean;
  email: boolean;
  quietHours: boolean;
}

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: queryKeys.notifications.list(),
    queryFn: async () => {
      const res = await api.get('/notifications');
      return extractList<Notification>(res);
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/notifications/read-all');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: ['notifications', 'preferences'],
    queryFn: async () => {
      const res = await api.get('/notifications/preferences/me');
      return res.data?.data ?? res.data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const res = await api.post('/notifications/preferences/me', data);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    },
  });
}