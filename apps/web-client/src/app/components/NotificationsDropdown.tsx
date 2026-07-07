"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { useSocket } from '../contexts/SocketContext';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

// BE-001: Notification UI — badge số chưa đọc + dropdown danh sách + realtime push.
// Contract (API_CONTRACT.md):
//   GET  /notifications                          -> { success, data: [{ id, type, message, relatedId, isRead, createdAt }] }
//   GET  /notifications/:userId/unread-count     -> { count }
//   POST /notifications/:userId/:id/read
//   POST /notifications/:userId/read-all
//   socket event: notification-<userId>

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
};

const typeIcon: Record<string, string> = {
  like: '❤️',
  comment: '💬',
  'friend-request': '👤',
  'friend-accept': '🤝',
  message: '✉️',
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return date.toLocaleDateString('vi-VN');
};

export default function NotificationsDropdown() {
  const { user } = useUser();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiFetch(`/notifications/${user.id}/unread-count`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {
      /* im lặng: lỗi mạng không nên làm vỡ navbar */
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await apiFetch('/notifications');
      if (res.ok) {
        const json = await res.json();
        setItems(Array.isArray(json?.data) ? json.data : []);
      }
    } catch {
      /* im lặng */
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Tải số chưa đọc khi có user
  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadUnreadCount(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadUnreadCount]);

  // Realtime: lắng nghe notification-<userId> đẩy từ chat-service
  useEffect(() => {
    if (!socket || !user?.id) return;
    const event = `notification-${user.id}`;
    const handler = () => {
      setUnreadCount((prev) => prev + 1);
      if (isOpen) loadNotifications();
    };
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, user?.id, isOpen, loadNotifications]);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) loadNotifications();
  };

  const markAllRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await apiFetch(`/notifications/${user.id}/read-all`, { method: 'POST' });
    } catch {
      /* nếu lỗi, lần mở sau loadNotifications sẽ đồng bộ lại */
    }
  };

  const markOneRead = async (n: NotificationItem) => {
    if (n.isRead || !user?.id) return;
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiFetch(`/notifications/${user.id}/${n.id}/read`, { method: 'POST' });
    } catch {
      /* im lặng */
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 hover:scale-105 transition-all relative"
        title="Thông báo"
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-[360px] glass rounded-2xl shadow-2xl overflow-hidden origin-top-right z-50 bg-white"
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Thông báo</h3>
              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="text-indigo-600 hover:text-indigo-500 text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
              {loading ? (
                <p className="text-center text-slate-400 p-6 text-sm">Đang tải...</p>
              ) : items.length === 0 ? (
                <p className="text-center text-slate-400 p-6 text-sm">Chưa có thông báo nào</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markOneRead(n)}
                    className={`w-full flex items-start gap-3 p-3 mt-1 rounded-xl hover:bg-slate-100/80 transition-colors text-left group ${n.isRead ? 'opacity-70' : 'bg-indigo-50/50'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                      {typeIcon[n.type] || '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug group-hover:text-slate-900 transition-colors ${n.isRead ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>{n.message}</p>
                      <span className={`text-[11px] font-medium mt-1 inline-block ${n.isRead ? 'text-slate-400' : 'text-indigo-600'}`}>{formatTime(n.createdAt)}</span>
                    </div>
                    {!n.isRead && <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0 mt-2 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
