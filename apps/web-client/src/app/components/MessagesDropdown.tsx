"use client";

import { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiFetch } from '../lib/api';
import Link from 'next/link';

type MessageUser = { id: string; fullName: string; avatarUrl?: string | null };
type Conversation = {
  id: string;
  otherMembers?: { user?: MessageUser }[];
  lastMessage?: { senderId: string; content: string; createdAt?: string };
};

export default function MessagesDropdown() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      apiFetch(`/api/chat/conversations/${user.id}`)
        .then(res => res.json())
        .then(data => setConversations(data))
        .catch(() => {});
    }
  }, [isOpen, user]);

  const openChatWidget = (conversation: Conversation) => {
    setIsOpen(false);
    // Find the other member to pass to ChatWidget
    const otherMember = conversation.otherMembers?.[0]?.user;
    if (otherMember) {
      // ChatWidget listens for this event
      window.dispatchEvent(new CustomEvent('openChat', { detail: otherMember }));
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 hover:scale-105 transition-all relative"
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] glass rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right z-50 bg-white">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800">Tin nhắn</h3>
            <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium transition-colors">Đánh dấu đã đọc</button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
            {conversations.length === 0 ? (
              <p className="text-center text-slate-400 p-6 text-sm">Chưa có tin nhắn nào</p>
            ) : (
              conversations.map((conv) => {
                const otherUser = conv.otherMembers?.[0]?.user;
                if (!otherUser) return null;
                const avatar = otherUser.avatarUrl || `https://i.pravatar.cc/150?u=${otherUser.id}`;
                
                return (
                  <button 
                    key={conv.id}
                    onClick={() => openChatWidget(conv)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100/80 transition-colors text-left group"
                  >
                    <div className="relative shrink-0">
                      <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[14px] text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{otherUser.fullName}</h4>
                      <div className="flex items-center justify-between text-[12px] mt-0.5">
                        <span className="text-slate-500 truncate pr-2 group-hover:text-slate-600">
                          {conv.lastMessage ? (conv.lastMessage.senderId === user?.id ? `Bạn: ${conv.lastMessage.content}` : conv.lastMessage.content) : 'Bắt đầu trò chuyện'}
                        </span>
                        <span className="text-slate-400 shrink-0 font-medium">{formatTime(conv.lastMessage?.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          
          <div className="p-3 border-t border-slate-200 text-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-b-2xl">
            <Link href="/chat" onClick={() => setIsOpen(false)} className="text-indigo-600 hover:text-indigo-700 text-[13px] font-semibold w-full block">Xem tất cả trong Messenger</Link>
          </div>
        </div>
      )}
    </div>
  );
}
