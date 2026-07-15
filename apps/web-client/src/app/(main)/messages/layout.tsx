'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Search, Edit, MoreHorizontal, Video, Phone, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { CreateGroupDialog } from '@/components/chat/conversations/CreateGroupDialog';

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user: authUser } = useAuthStore();
  const isThreadPage = pathname.startsWith('/messages/t/');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'group'>('all');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const keyword = searchQuery.trim();
        const response = await api.get(keyword.length >= 2 ? '/conversations/search' : '/conversations', {
          params: keyword.length >= 2 ? { q: keyword } : undefined,
        });
        const rawConvs = response.data.data || [];
        
        // Map backend Prisma objects to UI-friendly format
        const mapped = rawConvs.map((c: any) => {
          let displayName = c.title || c.name;
          let displayAvatar = c.avatarUrl || c.avatar;
          
          if (c.type === 'DIRECT' && c.members) {
            const otherMember = c.members.find((m: any) => m.userId !== authUser?.id) || c.otherMembers?.[0];
            const other = otherMember?.user;
            if (other) {
              displayName = other.fullName;
              displayAvatar = other.avatarUrl;
            }
          }
          const lastMessage = c.lastMessage;
          
          return {
            id: c.id,
            name: displayName || 'Không tên',
            avatarUrl: displayAvatar,
            lastMessage: lastMessage?.content || (lastMessage?.messageType === 'image' ? '[Hình ảnh]' : ''),
            isUnread: (c.unreadCount ?? 0) > 0,
            time: (lastMessage?.createdAt || c.updatedAt) ? new Date(lastMessage?.createdAt || c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            isOnline: false,
            type: c.type,
          };
        });
        
        setConversations(mapped.filter((c: any) => {
          if (filter === 'unread') return c.isUnread;
          if (filter === 'group') return c.type === 'GROUP';
          return true;
        }));
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    if (authUser?.id) fetchMessages();
  }, [authUser?.id, searchQuery, filter]);

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-background">
      {/* Left Sidebar: Conversations List */}
      <div className={cn(
        'h-full flex-shrink-0 flex-col border-r border-border/50 bg-card',
        isThreadPage ? 'hidden md:flex md:w-[360px]' : 'flex w-full md:w-[360px]',
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border/30 bg-card/95 p-3 pb-3 backdrop-blur-xl md:gap-4 md:p-5 md:pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-primary to-purple-500 md:text-[28px]">Đoạn chat</h1>
            <div className="flex gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background text-foreground shadow-sm transition-all hover:scale-105 hover:bg-hover md:h-10 md:w-10" aria-label="Tùy chọn đoạn chat">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background text-foreground shadow-sm transition-all hover:scale-105 hover:bg-hover md:h-10 md:w-10"
                aria-label="Tạo nhóm chat"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tin nhắn..." 
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full rounded-2xl border border-border/40 bg-background/50 pl-10 pr-4 text-sm text-foreground shadow-inner backdrop-blur-sm transition-all hover:bg-background/80 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 md:h-11 md:text-[15px]"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <button onClick={() => setFilter('all')} className={cn("min-h-9 shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", filter === 'all' ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-hover/50 border border-border/40 hover:bg-hover text-foreground")}>Tất cả</button>
            <button onClick={() => setFilter('unread')} className={cn("min-h-9 shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", filter === 'unread' ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-hover/50 border border-border/40 hover:bg-hover text-foreground")}>Chưa đọc</button>
            <button onClick={() => setFilter('group')} className={cn("min-h-9 shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", filter === 'group' ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-hover/50 border border-border/40 hover:bg-hover text-foreground")}>Nhóm</button>
          </div>
        </div>
        
        {/* List */}
        <div className="flex-1 space-y-1 overflow-y-auto p-2 pb-[calc(var(--mobile-bottom-nav-height)+var(--mobile-safe-bottom)+1rem)] md:pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-foreground/50">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-[13px]">Đang tải...</span>
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((conv) => {
              const isActive = pathname.includes(conv.id);
              const displayName = (conv.name || 'Cuộc trò chuyện').trim() || 'Cuộc trò chuyện';
              const avatarFallback = displayName.charAt(0).toUpperCase();
              return (
                <Link 
                  href={`/messages/t/${conv.id}`} 
                  key={conv.id}
                  className={cn(
                    "group relative mb-1 flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border p-3 transition-all duration-200",
                    isActive ? "bg-primary/10 border border-primary/20 shadow-sm" : "hover:bg-hover/80 border border-transparent"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
                  <div className="relative shrink-0">
                    <Avatar src={conv.avatarUrl} fallback={avatarFallback} size="lg" className="h-12 w-12 shadow-sm md:h-[52px] md:w-[52px]" />
                    {conv.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card shadow-sm"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-4 relative">
                    <h3 className={cn("truncate text-sm md:text-[15px]", (conv.isUnread || isActive) ? "font-bold text-foreground" : "font-medium text-foreground")}>
                      {displayName}
                    </h3>
                    <div className="mt-0.5 flex items-center text-xs text-foreground/60 md:text-[13px]">
                      <span className={cn("truncate", conv.isUnread ? "font-bold text-foreground" : "")}>
                        {conv.lastMessage}
                      </span>
                      <span className="mx-1.5 opacity-50">·</span>
                      <span className="shrink-0 text-foreground/50">{conv.time}</span>
                    </div>
                    
                    {/* Action button on hover */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-hover text-foreground/70 hover:text-foreground">
                        <MoreHorizontal className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  {conv.isUnread && !isActive && (
                    <div className="w-3 h-3 rounded-full bg-primary shrink-0 mr-1 shadow-sm shadow-primary/40"></div>
                  )}
                </Link>
              );
            })
          ) : (
            <div className="text-center p-4 text-foreground/50 text-[14px]">
              Chưa có cuộc trò chuyện nào
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        'relative h-full min-w-0 flex-1 flex-col overflow-hidden border-r border-border/50 bg-background',
        isThreadPage ? 'flex' : 'hidden md:flex',
      )}>
        {children}
      </div>

      {/* Right Sidebar: Chat Info (Placeholder for Facebook's right pane) */}
      <div className="hidden h-full w-[360px] flex-shrink-0 flex-col overflow-y-auto bg-card 2xl:flex">
        {/* Placeholder for now, can be populated by specific chat route */}
      </div>

      <CreateGroupDialog open={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
    </div>
  );
}
