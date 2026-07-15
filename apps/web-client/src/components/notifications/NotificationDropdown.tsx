'use client';

import React, { useState } from 'react';
import { NotificationItem } from './NotificationItem';
import { Check, Settings, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const NotificationDropdown = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const filteredNotifs = activeTab === 'ALL' ? notifications : notifications.filter(n => !n.isRead);

  return (
    <div className="absolute right-0 top-12 w-[360px] rounded-2xl z-50 flex flex-col max-h-[85vh] isolate">
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
        <div className="p-4 flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-foreground">Thông báo</h2>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full hover:bg-hover flex items-center justify-center transition-colors">
            <MoreHorizontal className="w-5 h-5 text-foreground/70" />
          </button>
        </div>
      </div>
      
      <div className="px-4 pb-2 flex gap-2">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${activeTab === 'ALL' ? 'bg-primary/20 text-primary' : 'hover:bg-hover text-foreground'}`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => setActiveTab('UNREAD')}
          className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${activeTab === 'UNREAD' ? 'bg-primary/20 text-primary' : 'hover:bg-hover text-foreground'}`}
        >
          Chưa đọc
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-[15px] font-semibold text-foreground">Mới nhất</span>
          <button onClick={markAllAsRead} className="text-[14px] text-primary hover:underline">Đánh dấu tất cả đã đọc</button>
        </div>
        
        {filteredNotifs.map(notif => (
          <NotificationItem key={notif.id} {...notif} onRead={markAsRead} />
        ))}
      </div>
      
      <div className="p-2 border-t border-border/50">
        <Link href="/notifications" onClick={onClose} className="block w-full text-center py-2 text-[14px] font-semibold text-primary hover:bg-hover rounded-lg transition-colors">
          Xem tất cả thông báo
        </Link>
        </div>
      </div>
    </div>
  );
};
