import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Search, X, Maximize2, Loader2, Phone, Video } from 'lucide-react';
import api from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { cn } from '@/lib/utils';

export const ChatBubble = () => {
  const { user } = useAuthStore();
  const { windows, openChat } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(typeof window !== 'undefined' && !!localStorage.getItem('auth_token'));
  }, [user?.id]);

  useEffect(() => {
    if (!isOpen || !hasToken) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const keyword = query.trim();
        const response = await api.get(keyword.length >= 2 ? '/conversations/search' : '/conversations', {
          params: keyword.length >= 2 ? { q: keyword } : undefined,
        });
        const raw = Array.isArray(response.data?.data) ? response.data.data : [];
        setConversations(raw);
      } catch (error) {
        console.error('Failed to fetch chat widget conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = window.setTimeout(fetchConversations, query.trim() ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [hasToken, isOpen, query, user?.id]);

  const mappedConversations = useMemo(() => {
    return conversations.map((conversation) => {
      let name = conversation.title || conversation.name || 'Không tên';
      let avatarUrl = conversation.avatarUrl;

      if (conversation.type === 'DIRECT') {
        const otherMember = conversation.members?.find((member: any) => member.userId !== user?.id) || conversation.otherMembers?.[0];
        const otherUser = otherMember?.user || otherMember;
        name = otherUser?.fullName || name;
        avatarUrl = otherUser?.avatarUrl || avatarUrl;
      }

      const lastMessage = conversation.lastMessage;
      const messageType = lastMessage?.messageType;
      return {
        id: conversation.id,
        name,
        avatarUrl,
        isOnline: false,
        lastMessage: messageType === 'call_audio'
          ? 'Cuộc gọi thoại'
          : messageType === 'call_video'
            ? 'Cuộc gọi video'
            : lastMessage?.content || (messageType === 'image' ? 'Đã gửi một ảnh' : 'Chưa có tin nhắn'),
        unreadCount: conversation.unreadCount ?? 0,
      };
    });
  }, [conversations, user?.id]);

  if (!hasToken || windows.length > 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 hidden flex-col items-end gap-3 md:flex">
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1020]/95 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h3 className="text-lg font-bold text-white">Messenger</h3>
              <p className="text-xs text-white/45">Tin nhắn, cuộc gọi, nhóm</p>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/messages" className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white" title="Mở Messenger">
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button onClick={() => setIsOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white" title="Đóng">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border-b border-white/10 p-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kiếm trên Messenger"
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/8 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/60 focus:bg-white/12 focus:ring-4 focus:ring-blue-500/15"
              />
            </div>
          </div>

          <div className="max-h-[390px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-white/45">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : mappedConversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/45">Chưa có cuộc trò chuyện</div>
            ) : (
              mappedConversations.map((conversation) => {
                const displayName = (conversation.name || 'Cuộc trò chuyện').trim() || 'Cuộc trò chuyện';
                const avatarFallback = displayName.charAt(0).toUpperCase();
                const isVideoCall = conversation.lastMessage === 'Cuộc gọi video';
                const isAudioCall = conversation.lastMessage === 'Cuộc gọi thoại';
                const CallIcon = isVideoCall ? Video : Phone;
                return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    openChat(conversation.id, displayName, conversation.avatarUrl, conversation.isOnline);
                    setIsOpen(false);
                  }}
                  className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/8"
                >
                  <div className="relative">
                    <Avatar src={conversation.avatarUrl} fallback={avatarFallback} size="md" />
                    {conversation.isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0b1020] bg-emerald-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{displayName}</div>
                    <div className={cn('flex items-center gap-1.5 truncate text-xs', conversation.unreadCount > 0 ? 'font-semibold text-blue-300' : 'text-white/45')}>
                      {(isAudioCall || isVideoCall) && <CallIcon className={cn('h-3.5 w-3.5 shrink-0', isVideoCall ? 'text-violet-300' : 'text-emerald-300')} />}
                      <span className="truncate">{conversation.lastMessage}</span>
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400 shadow-[0_0_16px_rgba(96,165,250,0.8)]" />}
                </button>
              );})
            )}
          </div>
          <Link href="/messages" className="block border-t border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-blue-300 transition hover:bg-white/10 hover:text-blue-200">
            Xem tất cả trong Chat
          </Link>
        </div>
      )}

      <button
        onClick={() => setIsOpen((value) => !value)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white shadow-[0_12px_30px_rgba(59,130,246,0.35)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Mở chat widget"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" fill="currentColor" />}
      </button>
    </div>
  );
};
