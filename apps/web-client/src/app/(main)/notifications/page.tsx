'use client';

import React, { useState, useCallback } from 'react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { MoreHorizontal, Loader2, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data;
    },
    enabled: !!user?.id,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notifId: string) => {
      return api.post(`/notifications/${notifId}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return api.post('/notifications/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkRead = useCallback((id: string) => {
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  const allNotifs = Array.isArray(notifications) ? notifications : [];
  const filteredNotifs = activeTab === 'ALL' ? allNotifs : allNotifs.filter((n: any) => !n.isRead);
  const unreadCount = allNotifs.filter((n: any) => !n.isRead).length;

  return (
    <div className="max-w-[680px] w-full pb-20 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[calc(100vh-8rem)] flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-[24px] font-bold text-gray-900">Thông báo</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                title="Đánh dấu tất cả đã đọc"
                className="w-9 h-9 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors text-green-600"
              >
                <CheckCheck className="w-5 h-5" />
              </button>
            )}
            <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 flex gap-2 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${activeTab === 'ALL' ? 'bg-blue-50 text-primary' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            Tất cả {unreadCount > 0 && `(${allNotifs.length})`}
          </button>
          <button
            onClick={() => setActiveTab('UNREAD')}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${activeTab === 'UNREAD' ? 'bg-blue-50 text-primary' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        <div className="flex-1 flex flex-col p-2 space-y-1">
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && filteredNotifs.map((notif: any) => (
            <NotificationItem
              key={notif.id}
              id={notif.id}
              title={notif.message || notif.content || ''}
              type={notif.type}
              isRead={notif.isRead}
              timeAgo={timeAgo(notif.createdAt)}
              onRead={handleMarkRead}
            />
          ))}
          {!isLoading && filteredNotifs.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-10">
              <p className="text-lg font-medium">Không có thông báo mới</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
