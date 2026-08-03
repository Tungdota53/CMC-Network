'use client';

import React, { useState } from 'react';
import { NotificationItem } from './NotificationItem';
import { Bell, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const NotificationDropdown = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const { notifications, markAsRead, markAllAsRead, isLoading } = useNotificationStore();

  const filteredNotifs = activeTab === 'ALL' ? notifications : notifications.filter(n => !n.isRead);
  const emptyTitle = activeTab === 'UNREAD' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo';
  const emptyDescription = activeTab === 'UNREAD'
    ? 'Thông báo mới hoặc chưa đọc sẽ xuất hiện tại đây.'
    : 'Khi có hoạt động mới, thông báo sẽ xuất hiện tại đây.';

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="notification-title" className="fixed inset-x-3 top-16 max-h-[calc(100dvh-5rem)] rounded-2xl z-50 flex flex-col isolate sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[400px] sm:max-h-[min(720px,calc(100dvh-5rem))]">
      {/* Bulletproof Glass Background Layer */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--card) 60%, transparent)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)'
        }}
      />
      
      <div className="relative z-10 flex flex-col h-full overflow-hidden rounded-2xl">
        <div className="sticky top-0 z-10 p-4 pb-2 flex items-center justify-between bg-card/85 backdrop-blur-xl">
        <h2 id="notification-title" className="text-[22px] font-bold text-foreground">Thông báo</h2>
        <div className="flex gap-2">
          <button type="button" aria-label="Tùy chọn thông báo" className="w-8 h-8 rounded-full hover:bg-hover flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <MoreHorizontal className="w-5 h-5 text-foreground/70" />
          </button>
        </div>
      </div>
      
      <div className="px-4 pb-2 flex gap-2 bg-card/85 backdrop-blur-xl" role="tablist" aria-label="Bộ lọc thông báo">
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'ALL'}
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${activeTab === 'ALL' ? 'bg-primary/20 text-primary' : 'hover:bg-hover text-foreground'}`}
        >
          Tất cả
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'UNREAD'}
          onClick={() => setActiveTab('UNREAD')}
          className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${activeTab === 'UNREAD' ? 'bg-primary/20 text-primary' : 'hover:bg-hover text-foreground'}`}
        >
          Chưa đọc
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto px-2 pb-2 min-h-[240px]">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-[15px] font-semibold text-foreground">Mới nhất</span>
          <button
            onClick={markAllAsRead}
            disabled={!notifications.some((notif) => !notif.isRead)}
            className="text-[14px] text-primary hover:underline disabled:cursor-not-allowed disabled:text-foreground/40 disabled:no-underline"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
        
        {isLoading ? (
          <div className="space-y-2 px-2 py-1" aria-label="Đang tải thông báo">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex animate-pulse items-center gap-3 rounded-xl p-3">
                <div className="h-12 w-12 shrink-0 rounded-full bg-foreground/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-4/5 rounded bg-foreground/10" />
                  <div className="h-3 w-2/5 rounded bg-foreground/10" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifs.length > 0 ? (
          filteredNotifs.map(notif => (
            <NotificationItem key={notif.id} {...notif} onRead={markAsRead} />
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center text-foreground/60">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="h-8 w-8" />
            </div>
            <p className="text-[16px] font-semibold text-foreground/80">{emptyTitle}</p>
            <p className="mt-1 text-[14px] leading-5">{emptyDescription}</p>
          </div>
        )}
      </div>
      
      <div className="sticky bottom-0 z-10 p-2 border-t border-border/50 bg-card/90 backdrop-blur-xl">
        <Link href="/notifications" onClick={onClose} className="block w-full text-center py-2 text-[14px] font-semibold text-primary hover:bg-hover rounded-lg transition-colors">
          Xem tất cả thông báo
        </Link>
        </div>
      </div>
    </div>
  );
};
