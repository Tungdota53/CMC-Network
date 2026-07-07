"use client";

import { Conversation } from '../types';
import toast from 'react-hot-toast';

interface ChatHeaderProps {
  selectedConversation: Conversation;
  setSelectedConversation: (conv: Conversation | null) => void;
  getAvatar: (id: string, avatarUrl?: string | null) => string;
  onToggleInfoPanel: () => void;
}

export default function ChatHeader({
  selectedConversation,
  setSelectedConversation,
  getAvatar,
  onToggleInfoPanel,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-4 p-4 lg:px-6 border-b border-white/50 bg-white/60 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-20">
      <button
        onClick={() => setSelectedConversation(null)}
        className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-slate-50 text-slate-800 transition-colors"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <div className="relative">
        <img src={getAvatar(selectedConversation.id, selectedConversation.avatarUrl)} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" alt="" />
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full shadow-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-[17px] text-slate-800 truncate">{selectedConversation.title}</p>
        <p className="text-[13px] text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Đang hoạt động
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => toast('Đang gọi cho ' + selectedConversation.title + '... (Tính năng đang Beta)', { icon: '📞' })} className="w-10 h-10 rounded-full bg-white hover:bg-indigo-50 text-indigo-600 shadow-sm border border-slate-100 flex items-center justify-center transition-all hover:scale-105">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
        </button>
        <button onClick={() => toast.error('Yêu cầu gọi video đến ' + selectedConversation.title + ' đã bị từ chối do thiết bị chưa hỗ trợ! (Beta)')} className="w-10 h-10 rounded-full bg-white hover:bg-indigo-50 text-indigo-600 shadow-sm border border-slate-100 flex items-center justify-center transition-all hover:scale-105">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        </button>
        <button onClick={onToggleInfoPanel} className="w-10 h-10 rounded-full bg-white hover:bg-indigo-50 text-indigo-600 shadow-sm border border-slate-100 flex items-center justify-center transition-all hover:scale-105">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </button>
      </div>
    </div>
  );
}
