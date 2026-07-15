'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Pin, PinOff, Phone, Users, Video } from 'lucide-react';
import api from '@/lib/api';

interface Props {
  id: string;
  name: string;
  lastMessage: string;
  avatarUrl?: string;
  time: string;
  unread: number;
  isOnline?: boolean;
  isGroup?: boolean;
  isPinned?: boolean;
  onPinnedChange?: (id: string, isPinned: boolean) => void;
}

export const ConversationItem = ({ id, name, lastMessage, avatarUrl, time, unread, isOnline, isGroup, isPinned, onPinnedChange }: Props) => {
  const pathname = usePathname();
  const displayName = (name || 'Cuộc trò chuyện').trim() || 'Cuộc trò chuyện';
  const avatarFallback = displayName.charAt(0).toUpperCase();
  const isActive = pathname === `/messages/t/${id}`;
  const isCallMessage = lastMessage === 'Cuộc gọi thoại' || lastMessage === 'Cuộc gọi video';
  const CallIcon = lastMessage === 'Cuộc gọi video' ? Video : Phone;

  return (
    <Link 
      href={`/messages/t/${id}`}
      className={`group relative flex items-center rounded-2xl p-2.5 transition-all ${
        isActive ? 'bg-primary/10 shadow-sm ring-1 ring-primary/15' : 'hover:bg-muted/70'
      }`}
    >
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <Avatar src={avatarUrl} fallback={avatarFallback} size="lg" className={isGroup ? 'bg-indigo-100 text-indigo-600' : ''} />
        {isGroup && (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-indigo-600 text-white shadow-sm">
            <Users className="h-3 w-3" />
          </div>
        )}
        {isOnline && (
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500 shadow-sm"></div>
        )}
      </div>

      {/* Content */}
      <div className="ml-3 min-w-0 flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className={`truncate text-[15px] ${unread > 0 ? 'font-bold text-foreground' : 'font-semibold text-foreground/90'}`}>
            {displayName}
          </h3>
          <span className={`ml-2 whitespace-nowrap text-xs ${unread > 0 ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
            {time}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-0.5">
          <p className={`flex min-w-0 items-center gap-1.5 truncate pr-2 text-[13px] ${unread > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
            {isCallMessage && <CallIcon className={`h-3.5 w-3.5 shrink-0 ${lastMessage === 'Cuộc gọi video' ? 'text-violet-500' : 'text-emerald-500'}`} />}
            <span className="truncate">{lastMessage || 'Bắt đầu trò chuyện'}</span>
          </p>
          {unread > 0 && (
            <div className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 shadow-sm shadow-primary/30">
              <span className="text-[10px] font-bold text-primary-foreground">{unread > 9 ? '9+' : unread}</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const nextPinned = !isPinned;
          onPinnedChange?.(id, nextPinned);
          try {
            await api.post(`/conversations/${id}/state`, { isPinned: nextPinned });
          } catch {
            onPinnedChange?.(id, !!isPinned);
          }
        }}
        className="absolute right-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-lg backdrop-blur group-hover:flex hover:bg-muted"
        aria-label={isPinned ? 'Bỏ ghim cuộc trò chuyện' : 'Ghim cuộc trò chuyện'}
        title={isPinned ? 'Bỏ ghim' : 'Ghim'}
      >
        {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
      </button>
    </Link>
  );
};
