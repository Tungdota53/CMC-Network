"use client";

import { Conversation, User } from '../types';
import { Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import VideoCallModal, { CallData } from '../../VideoCallModal';

interface ChatHeaderProps {
  selectedConversation: Conversation;
  setSelectedConversation: (conv: Conversation | null) => void;
  getAvatar: (id: string, avatarUrl?: string | null) => string;
  onToggleInfoPanel: () => void;
  isOnline: boolean;
  typingUsers: string[];
  socket: Socket | null;
  currentUser: User | null;
  onSearchInChat?: (query: string) => void;
}

export default function ChatHeader({
  selectedConversation,
  setSelectedConversation,
  getAvatar,
  onToggleInfoPanel,
  isOnline,
  typingUsers,
  socket,
  currentUser,
  onSearchInChat,
}: ChatHeaderProps) {
  const [isCalling, setIsCalling] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Listen for incoming calls
  useEffect(() => {
    if (!socket || !currentUser) return;
    const handleIncomingCall = (data: CallData) => {
      setIncomingCall(data);
      setIsCalling(true);
      setIsVideoCall(data.isVideo);
    };
    socket.on(`receiveCall-${currentUser.id}`, handleIncomingCall);
    return () => {
      socket.off(`receiveCall-${currentUser.id}`, handleIncomingCall);
    };
  }, [socket, currentUser]);

  const targetUser = selectedConversation.otherMembers[0]?.user;
  const isTyping = typingUsers.length > 0;

  const startCall = (video: boolean) => {
    setIsVideoCall(video);
    setIsCalling(true);
    setIncomingCall(null);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      onSearchInChat?.(searchQuery.trim());
    }
  };

  return (
    <>
      <div className="flex flex-col border-b border-slate-100 bg-white z-20 relative">
        {/* Main header row */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Back button (mobile) */}
          <button
            onClick={() => setSelectedConversation(null)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>

          {/* Avatar */}
          <div className="relative">
            <img
              src={getAvatar(selectedConversation.id, selectedConversation.avatarUrl)}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
              alt=""
            />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>

          {/* Name + Status */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] text-slate-800 truncate leading-tight">{selectedConversation.title}</p>
            {isTyping ? (
              <p className="text-[12px] text-indigo-500 font-medium flex items-center gap-1 mt-0.5">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '200ms' }} />
                </span>
                Đang gõ...
              </p>
            ) : (
              <p className={`text-[12px] font-medium mt-0.5 ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => startCall(false)}
              title="Gọi thoại"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-all"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            </button>
            <button
              onClick={() => startCall(true)}
              title="Gọi video"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-all"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              title="Tìm tin nhắn"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                showSearch
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600'
              }`}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
            <button
              onClick={onToggleInfoPanel}
              title="Thông tin"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-all"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </button>
          </div>
        </div>

        {/* Inline search bar */}
        {showSearch && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                placeholder="Tìm trong cuộc trò chuyện..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 outline-none border border-transparent focus:border-indigo-300 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              className="text-[12px] font-medium text-slate-500 hover:text-slate-700 transition-colors px-2"
            >
              Hủy
            </button>
          </div>
        )}
      </div>

      {isCalling && socket && currentUser && targetUser && (
        <VideoCallModal
          socket={socket}
          currentUser={currentUser}
          targetUser={incomingCall ? null : targetUser}
          callData={incomingCall}
          isInitiator={!incomingCall}
          isVideo={isVideoCall}
          onEndCall={() => {
            setIsCalling(false);
            setIncomingCall(null);
          }}
        />
      )}
    </>
  );
}
