'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Search, Edit, MessageCircle, MoreHorizontal, Users, X } from 'lucide-react';
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
  const { user: authUser, hasHydrated } = useAuthStore();
  const isThreadPage = pathname.startsWith('/messages/t/');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'group'>('all');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  useEffect(() => {
    if (!authUser?.id) {
      setLoading(false);
      setConversations([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setLoadError(false);
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
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [authUser?.id, searchQuery, filter, retryKey]);

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-background">
      {/* Left Sidebar: Conversations List */}
      <div className={cn(
        'h-full flex-shrink-0 flex-col border-r border-border bg-card',
        isThreadPage ? 'hidden md:flex md:w-[320px] lg:w-[344px]' : 'flex w-full md:w-[320px] lg:w-[344px]',
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-card px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">CMC Network</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-foreground">Tin nhắn</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Tạo nhóm chat"
              >
                <Edit className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input 
              type="search"
              aria-label="Tìm cuộc trò chuyện"
              placeholder="Tìm người hoặc nhóm"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-full rounded-xl border border-transparent bg-hover pl-10 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-3 focus:ring-primary/10"
            />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-hover hover:text-foreground" aria-label="Xóa tìm kiếm"><X className="h-4 w-4" /></button>}
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <button onClick={() => setFilter('all')} className={cn("min-h-10 shrink-0 rounded-xl px-3.5 text-sm font-semibold transition-colors", filter === 'all' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-hover hover:text-foreground")}><MessageCircle className="mr-1.5 inline h-4 w-4" />Tất cả</button>
            <button onClick={() => setFilter('unread')} className={cn("min-h-10 shrink-0 rounded-xl px-3.5 text-sm font-semibold transition-colors", filter === 'unread' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-hover hover:text-foreground")}>Chưa đọc</button>
            <button onClick={() => setFilter('group')} className={cn("min-h-10 shrink-0 rounded-xl px-3.5 text-sm font-semibold transition-colors", filter === 'group' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-hover hover:text-foreground")}><Users className="mr-1.5 inline h-4 w-4" />Nhóm</button>
          </div>
        </div>
        
        {/* List */}
        <div className="flex-1 space-y-1 overflow-y-auto p-2 pb-[calc(var(--mobile-bottom-nav-height)+var(--mobile-safe-bottom)+1rem)] md:pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20">
          {loading ? (
            <div className="space-y-2 px-2 py-3" aria-label="Đang tải cuộc trò chuyện" aria-busy="true">
              {[1, 2, 3, 4, 5].map((item) => <div key={item} className="flex animate-pulse items-center gap-3 rounded-xl p-2"><div className="h-12 w-12 rounded-full bg-hover" /><div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-hover" /><div className="h-3 w-5/6 rounded bg-hover" /></div></div>)}
            </div>
          ) : loadError ? (
            <div role="alert" className="mx-3 mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-center">
              <MessageCircle className="mx-auto h-7 w-7 text-destructive" />
              <p className="mt-3 text-sm font-semibold text-foreground">Không thể tải cuộc trò chuyện</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Kiểm tra kết nối rồi thử lại.</p>
              <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-4 min-h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Thử lại</button>
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
                    "group relative mb-0.5 flex min-h-[68px] cursor-pointer items-center gap-3 overflow-hidden rounded-xl border px-2.5 py-2 transition-colors",
                    isActive ? "border-primary/15 bg-primary/10" : "border-transparent hover:bg-hover"
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
          ) : !authUser?.id ? (
            <div className="mx-3 mt-8 rounded-2xl border border-dashed border-border p-6 text-center">
              <MessageCircle className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-foreground">Bạn chưa đăng nhập</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Đăng nhập để xem danh sách tin nhắn và kết nối với bạn bè.</p>
              <Link href="/login" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            <div className="mx-3 mt-8 rounded-2xl border border-dashed border-border p-6 text-center">
              <MessageCircle className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-foreground">{searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện'}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{searchQuery ? 'Thử tên hoặc từ khóa khác.' : 'Tạo nhóm mới để bắt đầu kết nối.'}</p>
              {!searchQuery && <button type="button" onClick={() => setIsCreateGroupOpen(true)} className="mt-4 min-h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Tạo nhóm chat</button>}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        'relative h-full min-w-0 flex-1 flex-col overflow-hidden bg-background',
        isThreadPage ? 'flex' : 'hidden md:flex',
      )}>
        {children}
      </div>

      <CreateGroupDialog open={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
    </div>
  );
}
