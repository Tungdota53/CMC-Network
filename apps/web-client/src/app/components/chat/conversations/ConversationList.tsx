"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Conversation, User } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  searchText: string;
  setSearchText: (text: string) => void;
  loading: boolean;
  currentUser: User | null;
  selectConversation: (conversation: Conversation) => void;
  formatMessageTime: (value?: string) => string;
  getAvatar: (id: string, avatarUrl?: string | null) => string;
  onlineUsers: string[];
  onNewChat: () => void;
  typingConversations?: Record<string, string[]>;
}

type FilterTab = 'all' | 'unread' | 'groups';

export default function ConversationList({
  conversations,
  selectedConversation,
  searchText,
  setSearchText,
  loading,
  currentUser,
  selectConversation,
  formatMessageTime,
  getAvatar,
  onlineUsers,
  onNewChat,
  typingConversations = {},
}: ConversationListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredByTab = conversations.filter((c) => {
    if (activeFilter === 'unread') return (c.unreadCount ?? 0) > 0;
    if (activeFilter === 'groups') return c.type === 'GROUP';
    return true;
  });

  // Pinned conversations first
  const sorted = [...filteredByTab].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const filters: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: 'Chưa đọc' },
    { key: 'groups', label: 'Nhóm' },
  ];

  return (
    <div className={`w-full md:w-[360px] border-r border-slate-100 bg-white flex flex-col relative overflow-hidden ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <a
              href="/"
              title="Về trang chủ"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all shadow-sm"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </a>
            <h2 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Đoạn chat</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNewChat}
            title="Đoạn chat mới"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all shadow-sm"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-[13.5px] text-slate-800 placeholder-slate-400 outline-none border border-transparent focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${
                activeFilter === f.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar relative z-10">
        {loading && (
          <div className="space-y-1 px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 8h8m-8 8h4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-slate-600 font-bold text-[14px]">
              {activeFilter === 'unread' ? 'Không có tin chưa đọc' : activeFilter === 'groups' ? 'Chưa có nhóm nào' : 'Chưa có đoạn chat nào'}
            </p>
            <p className="text-slate-400 text-[13px] mt-1">Bắt đầu trò chuyện để kết nối</p>
            {activeFilter === 'all' && (
              <button
                onClick={onNewChat}
                className="mt-4 px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] font-semibold rounded-full transition-colors shadow-sm"
              >
                Bắt đầu trò chuyện
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {sorted.map((conversation, index) => {
            const otherUserId = conversation.otherMembers[0]?.userId ?? '';
            const isOnline = onlineUsers.includes(otherUserId);
            const unread = conversation.unreadCount ?? 0;
            const isSelected = selectedConversation?.id === conversation.id;
            const isTypingInConv = (typingConversations[conversation.id] || []).filter((id) => id !== currentUser?.id).length > 0;

            return (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
                onClick={() => selectConversation(conversation)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all relative ${
                  isSelected
                    ? 'bg-indigo-50/80'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Pinned indicator */}
                {conversation.isPinned && (
                  <span className="absolute top-2 right-3 text-[10px] text-slate-400">📌</span>
                )}

                {/* Avatar */}
                <div className="relative shrink-0">
                  {conversation.type === 'GROUP' && conversation.otherMembers.length >= 2 ? (
                    /* Group avatar stack */
                    <div className="w-12 h-12 relative">
                      <img
                        src={getAvatar(conversation.otherMembers[0]?.userId, conversation.otherMembers[0]?.user.avatarUrl)}
                        className="absolute top-0 left-0 w-8 h-8 rounded-full object-cover ring-2 ring-white z-[2]"
                        alt=""
                      />
                      <img
                        src={getAvatar(conversation.otherMembers[1]?.userId, conversation.otherMembers[1]?.user.avatarUrl)}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full object-cover ring-2 ring-white z-[1]"
                        alt=""
                      />
                    </div>
                  ) : (
                    <img
                      src={getAvatar(conversation.id, conversation.avatarUrl)}
                      className={`w-12 h-12 rounded-full object-cover ${isSelected ? 'ring-2 ring-indigo-300' : 'ring-1 ring-slate-100'}`}
                      alt=""
                    />
                  )}
                  {/* Online status */}
                  {conversation.type === 'DIRECT' && (
                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full transition-colors ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-[14px] truncate ${isSelected ? 'text-indigo-700' : unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                      {conversation.title}
                    </p>
                    <span className={`text-[11px] shrink-0 ${unread > 0 ? 'text-indigo-500 font-semibold' : 'text-slate-400'}`}>
                      {formatMessageTime(conversation.lastMessage?.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    {isTypingInConv ? (
                      <p className="text-[13px] text-indigo-500 font-medium flex items-center gap-1 truncate">
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '100ms' }} />
                          <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '200ms' }} />
                        </span>
                        Đang gõ...
                      </p>
                    ) : (
                      <p className={`text-[13px] truncate ${unread > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                        {conversation.lastMessage
                          ? `${conversation.lastMessage.senderId === currentUser?.id ? 'Bạn: ' : ''}${
                              conversation.lastMessage.content ||
                              (conversation.lastMessage.messageType === 'image'
                                ? '📷 Ảnh'
                                : conversation.lastMessage.messageType === 'video'
                                  ? '🎥 Video'
                                  : '📎 Tệp tin')
                            }`
                          : 'Bắt đầu trò chuyện'}
                      </p>
                    )}
                    {unread > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
