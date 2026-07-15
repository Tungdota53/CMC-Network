'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-primary/20 text-primary' : 'bg-hover hover:bg-foreground/10 text-foreground'}`}
      >
        <Bell className="w-[20px] h-[20px]" fill={isOpen ? 'currentColor' : 'none'} strokeWidth={isOpen ? 0 : 2} />
        {unreadCount > 0 && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-card">
            <span className="text-[10px] font-bold text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </button>

      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
};
