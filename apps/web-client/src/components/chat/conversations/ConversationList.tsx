'use client';

import React, { useEffect, useState } from 'react';
import { ConversationListHeader } from './ConversationListHeader';
import { ConversationItem } from './ConversationItem';
import { CreateGroupDialog } from './CreateGroupDialog';
import { MessageCircle, Search, Users } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatClockTime } from '@/lib/time';

type Filter = 'inbox' | 'group' | 'unread';

export const ConversationList = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('inbox');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const keyword = searchQuery.trim();
        const response = await api.get(keyword.length >= 2 ? '/conversations/search' : '/conversations', {
          params: keyword.length >= 2 ? { q: keyword } : undefined,
        });
        const rawConvs = response.data?.data || [];
        const mapped = rawConvs.map((c: any) => {
          const otherMember = c.type === 'DIRECT'
            ? (c.members?.find((m: any) => m.userId !== user?.id) || c.otherMembers?.[0])
            : null;
          const other = otherMember?.user;
          const lastMessage = c.lastMessage;

          return {
            id: c.id,
            name: c.type === 'DIRECT' ? (other?.fullName || c.title || 'Không tên') : (c.title || c.name || 'Nhóm'),
            avatarUrl: c.type === 'DIRECT' ? (other?.avatarUrl || c.avatarUrl) : c.avatarUrl,
            lastMessage: lastMessage?.messageType === 'call_audio'
              ? 'Cuộc gọi thoại'
              : lastMessage?.messageType === 'call_video'
                ? 'Cuộc gọi video'
                : lastMessage?.content || (lastMessage?.messageType === 'image' ? 'Đã gửi một ảnh' : ''),
            time: formatClockTime(lastMessage?.createdAt || c.updatedAt),
            unread: c.unreadCount ?? 0,
            isOnline: false,
            isGroup: c.type === 'GROUP',
            isPinned: c.userState?.isPinned ?? c.state?.isPinned ?? c.isPinned ?? false,
          };
        }).filter((c: any) => {
          if (filter === 'group') return c.isGroup;
          if (filter === 'unread') return c.unread > 0;
          return true;
        }).sort((a: any, b: any) => Number(b.isPinned) - Number(a.isPinned));
        setConversations(mapped);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchConversations();
  }, [user?.id, searchQuery, filter]);

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-background via-background to-muted/25">
      <div className="shrink-0 space-y-4 border-b border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <ConversationListHeader onCreateGroup={() => setIsCreateGroupOpen(true)} />
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="block h-11 w-full rounded-2xl border border-border/60 bg-muted/70 pl-11 pr-4 text-sm text-foreground shadow-inner outline-none transition focus:border-primary/40 focus:bg-background focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground"
            placeholder="Tìm kiếm trên Messenger"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { value: 'inbox' as Filter, label: 'Hộp thư', Icon: MessageCircle },
            { value: 'group' as Filter, label: 'Cộng đồng', Icon: Users },
            { value: 'unread' as Filter, label: 'Chưa đọc', Icon: MessageCircle },
          ].map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
                filter === value
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {loading ? (
          <div className="space-y-2 px-2 py-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex animate-pulse items-center gap-3 rounded-2xl p-2">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded-full bg-muted" />
                  <div className="h-3 w-1/2 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length > 0 ? (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              {...conversation}
              onPinnedChange={(id, isPinned) => {
                setConversations((items) => items
                  .map((item) => item.id === id ? { ...item, isPinned } : item)
                  .sort((a, b) => Number(b.isPinned) - Number(a.isPinned)));
              }}
            />
          ))
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">Chưa có cuộc trò chuyện nào</div>
        )}
      </div>

      <CreateGroupDialog open={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
    </div>
  );
};
