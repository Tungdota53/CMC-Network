'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, MoreHorizontal, Maximize2, Edit, Search, CheckCircle2, Inbox } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

export function MessageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user: authUser } = useAuthStore();
  const { openChat } = useChatStore();

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch dynamic messages
  useEffect(() => {
    if (isOpen) {
      const fetchMessages = async () => {
        try {
          setLoading(true);
          const keyword = searchQuery.trim();
          const response = await api.get(keyword.length >= 2 ? '/conversations/search' : '/conversations', {
            params: keyword.length >= 2 ? { q: keyword } : undefined,
          });
          const rawConvs = response.data.data || [];
          
          const mapped = rawConvs.map((c: any) => {
            let displayName = c.title || c.name;
            let displayAvatar = c.avatarUrl;
            
            if (c.type === 'DIRECT' && c.members) {
              const otherMember = c.members.find((m: any) => m.userId !== authUser?.id) || c.otherMembers?.[0];
              const other = otherMember?.user;
              if (other) {
                displayName = other.fullName;
                displayAvatar = other.avatarUrl;
              }
            }
            
            const myMember = c.members?.find((m: any) => m.userId === authUser?.id);
            const lastMessage = c.lastMessage;
            
            return {
              id: c.id,
              name: displayName || 'Không tên',
              avatarUrl: displayAvatar,
              lastMessage: lastMessage?.content || (lastMessage?.messageType === 'image' ? '[Hình ảnh]' : ''),
              isUnread: (c.unreadCount ?? myMember?.unreadCount ?? 0) > 0,
              time: (lastMessage?.createdAt || c.updatedAt) ? new Date(lastMessage?.createdAt || c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              isOnline: false,
            };
          });
          
          setConversations(mapped);
        } catch (error: any) {
          console.error('Failed to fetch messages:', error.response?.data || error.message || error);
          setConversations([]);
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [isOpen, authUser?.id, searchQuery]);

  const handleOpenChat = (conv: any) => {
    setIsOpen(false);
    openChat(conv.id, conv.name, conv.avatarUrl, conv.isOnline);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-primary/20 ${isOpen ? 'bg-primary/20 text-primary' : 'bg-hover hover:bg-foreground/10 text-foreground'}`}
      >
        <MessageCircle className="w-[20px] h-[20px]" fill={isOpen ? 'currentColor' : 'currentColor'} strokeWidth={0} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 rounded-2xl z-50 flex flex-col max-h-[80vh] animate-in slide-in-from-top-2 fade-in duration-200 isolate">
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
            {/* Header */}
            <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[24px] font-bold text-foreground">Đoạn chat</h2>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full hover:bg-hover flex items-center justify-center transition-colors text-foreground/70" title="Tùy chọn">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <Link href="/messages" onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-hover flex items-center justify-center transition-colors text-foreground/70" title="Mở rộng">
                  <Maximize2 className="w-4 h-4" />
                </Link>
                <button className="w-8 h-8 rounded-full hover:bg-hover flex items-center justify-center transition-colors text-foreground/70" title="Tin nhắn mới">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 h-4 text-foreground/50" />
              </div>
              <input 
                type="text" 
                placeholder="Tìm kiếm trên Messenger" 
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-hover pl-9 pr-4 py-2 rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              />
            </div>
          </div>
          
          {/* Tabs */}
          <div className="px-4 py-2 flex gap-2">
            <button className="px-3 py-1.5 bg-primary/10 text-primary font-semibold text-[14px] rounded-full">
              Hộp thư
            </button>
            <button className="px-3 py-1.5 hover:bg-hover text-foreground font-semibold text-[14px] rounded-full transition-colors">
              Cộng đồng
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-foreground/50 gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[14px]">Đang tải...</span>
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => (
                <div key={conv.id} onClick={() => handleOpenChat(conv)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors cursor-pointer group relative">
                  <div className="relative shrink-0">
                    <Avatar src={conv.avatarUrl} fallback={conv.name.charAt(0)} size="lg" className="w-[50px] h-[50px]" />
                    {conv.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className={`text-[15px] truncate ${conv.isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                      {conv.name}
                    </h3>
                    <div className="flex items-center text-[13px] text-foreground/60 mt-0.5">
                      <span className={`truncate ${conv.isUnread ? 'font-bold text-primary' : ''}`}>
                        {conv.lastMessage}
                      </span>
                      <span className="mx-1">·</span>
                      <span className="shrink-0">{conv.time}</span>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {conv.isUnread && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 absolute right-4"></div>
                  )}
                  
                  {/* Check circle (seen) - only if not unread */}
                  {!conv.isUnread && (
                    <div className="shrink-0 absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 className="w-4 h-4 text-foreground/40" />
                    </div>
                  )}
                  
                  {/* Action button (hover) */}
                  <button className="absolute right-2 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-background border border-border shadow-sm flex items-center justify-center transition-all hover:bg-hover">
                    <MoreHorizontal className="w-5 h-5 text-foreground/70" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-foreground/50 py-10">
                <div className="w-16 h-16 rounded-full bg-hover flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8 text-foreground/40" />
                </div>
                <span className="text-[16px] font-semibold text-foreground/80">Không có tin nhắn nào</span>
                <span className="text-[14px]">Khi bạn có tin nhắn mới, chúng sẽ xuất hiện ở đây.</span>
              </div>
            )}
          </div>
          
            {/* Footer */}
            <div className="p-2 border-t border-border/50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <Link href="/messages" onClick={() => setIsOpen(false)} className="block w-full text-center py-2 text-[15px] font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors">
                Xem tất cả trong Chat
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
