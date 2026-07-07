"use client";

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
}

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
}: ConversationListProps) {
  const filteredConversations = conversations.filter((conversation) => 
    conversation.title.toLowerCase().includes(searchText.trim().toLowerCase())
  );

  return (
    <div className={`w-full md:w-[380px] border-r border-slate-200/50 bg-slate-50/40 flex flex-col relative ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none z-0" />
      
      <div className="p-6 border-b border-slate-200/50 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-[26px] font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-900 tracking-tight">Đoạn chat</h2>
          <button className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-indigo-600 flex items-center justify-center transition-all shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgba(79,70,229,0.15)] hover:scale-105">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
        <div className="relative mt-5 group">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm kiếm tin nhắn..."
            className="w-full pl-11 pr-5 py-3 bg-white/70 rounded-2xl text-[14px] font-medium text-slate-800 placeholder-slate-400 outline-none border border-slate-200/60 focus:border-indigo-400/80 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative z-10">
        {loading && <p className="text-slate-500 font-medium text-center text-sm p-4 animate-pulse">Đang tải đoạn chat...</p>}
        {!loading && filteredConversations.length === 0 && <p className="text-slate-500 font-medium text-center text-sm p-4">Chưa có đoạn chat nào</p>}

        <AnimatePresence>
          {filteredConversations.map((conversation, index) => (
            <motion.button
              key={conversation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectConversation(conversation)}
              className={`w-full flex items-center gap-4 p-3.5 rounded-2xl text-left transition-colors group ${
                selectedConversation?.id === conversation.id 
                  ? 'bg-white shadow-[0_4px_20px_rgba(79,70,229,0.08)] border border-indigo-100/80' 
                  : 'bg-transparent hover:bg-white/60 border border-transparent hover:border-slate-200/50 hover:shadow-sm'
              }`}
            >
              <div className="relative shrink-0">
                <img src={getAvatar(conversation.id, conversation.avatarUrl)} className="w-14 h-14 rounded-full object-cover shadow-sm" alt="" />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-bold text-[15px] truncate transition-colors ${selectedConversation?.id === conversation.id ? 'text-indigo-700' : 'text-slate-800 group-hover:text-indigo-600'}`}>{conversation.title}</p>
                  <span className={`text-[11px] shrink-0 font-semibold ${selectedConversation?.id === conversation.id ? 'text-indigo-500' : 'text-slate-400'}`}>{formatMessageTime(conversation.lastMessage?.createdAt)}</span>
                </div>
                <p className={`text-[13px] truncate mt-1 font-medium ${selectedConversation?.id === conversation.id ? 'text-slate-600' : 'text-slate-500'}`}>
                  {conversation.lastMessage ? `${conversation.lastMessage.senderId === currentUser?.id ? 'Bạn: ' : ''}${conversation.lastMessage.content}` : 'Bắt đầu trò chuyện'}
                </p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
