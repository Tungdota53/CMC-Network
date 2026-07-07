"use client";

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket } from '../contexts/SocketContext';
import VideoCallModal, { CallData } from './VideoCallModal';

type User = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: string;
  mediaUrl?: string;
  createdAt: string;
  sender?: User;
};

type ActiveChat = User & {
  conversationId: string;
};

const CHAT_API_URL = '/api';

const getAvatar = (user: User) => user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`;

export default function ChatWidget() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const { socket } = useSocket();
  const socketRef = useRef<Socket | null>(null);
  
  // Call State
  const [isCalling, setIsCalling] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<ActiveChat | null>(null);
  const isMinimizedRef = useRef<boolean>(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
    if (!isMinimized) {
      const timeoutId = window.setTimeout(() => setUnreadCount(0), 0); // Reset unread when opened
      return () => window.clearTimeout(timeoutId);
    }
  }, [isMinimized]);

  useEffect(() => {
    const info = localStorage.getItem('user_info');
    if (!info) return;

    let handleOpenChat: ((event: Event) => void) | null = null;

    const timeoutId = window.setTimeout(() => {
      try {
        const user = JSON.parse(info);
        setCurrentUser(user);

        handleOpenChat = async (event: Event) => {
          const friend = (event as CustomEvent<User>).detail;
          setIsOpen(true);
          setIsMinimized(false);

          const response = await fetch(`${CHAT_API_URL}/chat/conversations/direct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user1Id: user.id, user2Id: friend.id }),
          });
          if (!response.ok) return;

          const conversation = await response.json();
          setActiveChat({ ...friend, conversationId: conversation.id });

          const messagesResponse = await fetch(`${CHAT_API_URL}/chat/messages/${conversation.id}`);
          if (messagesResponse.ok) setMessages(await messagesResponse.json());
        };

        window.addEventListener('openChat', handleOpenChat);
      } catch {}
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      socket?.disconnect();
      if (handleOpenChat) window.removeEventListener('openChat', handleOpenChat);
    };
  }, []);

  useEffect(() => {
    socketRef.current = socket;
    if (!socket || !currentUser) return;

    // Listen for incoming messages globally
    const handleGlobalMessage = (message: Message) => {
      const currentChat = activeChatRef.current;
      if (currentChat && currentChat.conversationId === message.conversationId) {
        setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
        if (isMinimizedRef.current) {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    const handleGlobalRecall = (data: { conversationId: string; messageId: string; message: Message }) => {
      const currentChat = activeChatRef.current;
      if (currentChat && currentChat.conversationId === data.conversationId) {
        setMessages((prev) => prev.map((item) => (item.id === data.messageId ? data.message : item)));
      }
    };

    // Listen for incoming calls
    const handleIncomingCall = (data: CallData) => {
      setIncomingCall(data);
      setIsCalling(true);
      setIsVideoCall(data.isVideo);
    };

    socket.on(`receiveMessage-${currentUser.id}`, handleGlobalMessage);
    socket.on('messageRecalled', handleGlobalRecall);
    socket.on(`receiveCall-${currentUser.id}`, handleIncomingCall);

    return () => {
      socket.off(`receiveMessage-${currentUser.id}`, handleGlobalMessage);
      socket.off('messageRecalled', handleGlobalRecall);
      socket.off(`receiveCall-${currentUser.id}`, handleIncomingCall);
    };
  }, [socket, currentUser]);

  useEffect(() => {
    if (!socket || !activeChat) return;

    const eventName = `conversation-${activeChat.conversationId}`;
    const handleNewMessage = (message: Message) => {
      setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
    };
    
    socket.on(eventName, handleNewMessage);
    return () => {
      socket.off(eventName, handleNewMessage);
    };
  }, [socket, activeChat]);

  // useLayoutEffect for immediate scrolling on messages update
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChat || !currentUser || !socketRef.current) return;

    socketRef.current.emit('sendMessage', {
      conversationId: activeChat.conversationId,
      senderId: currentUser.id,
      receiverId: activeChat.id,
      content: inputText.trim(),
    });

    setInputText('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeChat || !currentUser || !socketRef.current) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const messageType = isImage ? 'image' : isVideo ? 'video' : 'file';

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      socketRef.current?.emit('sendMessage', {
        conversationId: activeChat.conversationId,
        senderId: currentUser.id,
        receiverId: activeChat.id,
        content: `Đã gửi một ${isImage ? 'ảnh' : isVideo ? 'video' : 'tệp tin'}: ${file.name}`,
        messageType,
        mediaUrl: base64,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRecall = (messageId: string) => {
    if (!activeChat || !currentUser || !socketRef.current) return;
    socketRef.current.emit('recallMessage', {
      messageId,
      userId: currentUser.id,
      conversationId: activeChat.conversationId,
      receiverId: activeChat.id
    });
  };

  if (!currentUser || !isOpen || !activeChat) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-2xl border border-slate-200 bg-white hover:scale-105 transition-transform group"
        title={activeChat.fullName}
      >
        <img src={getAvatar(activeChat)} className="w-full h-full rounded-full object-cover group-hover:opacity-90 transition-opacity" alt="" />
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 md:right-6 w-[320px] h-[430px] bg-white/90 backdrop-blur-xl border border-slate-200 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col z-50 overflow-hidden">
      <div className="bg-slate-50/90 px-4 py-3 flex justify-between items-center border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <img src={getAvatar(activeChat)} className="w-9 h-9 rounded-full object-cover border border-slate-200" alt="" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-[14px] truncate">{activeChat.fullName}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Đang hoạt động</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Voice Call Button */}
          <button 
            className="w-8 h-8 rounded-full text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-colors" 
            title="Gọi thoại"
            onClick={() => { setIsCalling(true); setIsVideoCall(false); }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          </button>
          
          {/* Video Call Button */}
          <button 
            className="w-8 h-8 rounded-full text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-colors mr-1" 
            title="Gọi video"
            onClick={() => { setIsCalling(true); setIsVideoCall(true); }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </button>

          <button className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors" onClick={() => setIsMinimized(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"/></svg>
          </button>
          <button className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors" onClick={() => setIsOpen(false)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar bg-transparent">
        <div className="flex flex-col items-center text-center pb-4 pt-2">
          <img src={getAvatar(activeChat)} className="w-16 h-16 rounded-full object-cover mb-3 border border-slate-200 shadow-sm" alt="" />
          <p className="font-bold text-slate-800">{activeChat.fullName}</p>
          <p className="text-xs text-slate-500 mt-0.5">CMC Network Messenger</p>
        </div>

        {messages.map((message) => {
          const isMe = message.senderId === currentUser.id;
          const isRecalled = message.messageType === 'recalled';
          const isImage = message.messageType === 'image';

          const isFile = message.messageType === 'file';
          const isVideo = message.messageType === 'video';

          return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
              <div className={`max-w-[75%] rounded-[20px] px-3 py-2 text-[14px] break-words ${isMe ? 'bg-indigo-600 text-white rounded-br-md shadow-sm' : 'bg-white text-slate-800 rounded-bl-md border border-slate-200 shadow-sm'} ${isRecalled ? 'italic opacity-60 !bg-transparent border border-slate-200 !text-slate-500 shadow-none' : ''}`}>
                {isImage && message.mediaUrl ? (
                  <img src={message.mediaUrl} className="max-w-full rounded-xl mt-1 mb-1 border border-slate-200" alt="Sent image" />
                ) : isVideo && message.mediaUrl ? (
                  <video src={message.mediaUrl} controls className="max-w-full rounded-xl mt-1 mb-1 border border-slate-200" />
                ) : isFile && message.mediaUrl ? (
                  <a href={message.mediaUrl} download className="flex items-center gap-2 text-blue-300 hover:text-blue-100 underline mt-1 mb-1">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    Tải tệp tin
                  </a>
                ) : (
                  message.content
                )}
              </div>
              
              {isMe && !isRecalled && (
                <button 
                  onClick={() => handleRecall(message.id)}
                  className="absolute top-1/2 -translate-y-1/2 right-[calc(100%+5px)] opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                  title="Thu hồi tin nhắn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                </button>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-slate-50/90 backdrop-blur-md border-t border-slate-200 flex items-center gap-2">
        <input 
          type="file" 
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 rounded-full hover:bg-slate-200 flex items-center justify-center text-indigo-600 transition-colors shrink-0"
          title="Gửi ảnh"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSendMessage()}
          placeholder="Aa"
          className="flex-1 bg-white text-slate-800 rounded-full px-4 py-2 text-[14px] outline-none border border-slate-200 focus:border-indigo-400 focus:bg-slate-50 transition-all shadow-inner placeholder-slate-400"
        />
        <button
          onClick={handleSendMessage}
          className="w-9 h-9 rounded-full flex items-center justify-center text-indigo-600 hover:text-indigo-500 transition-colors shrink-0"
        >
          {inputText.trim() ? (
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          ) : '👍'}
        </button>
      </div>

      {/* Render Video Call Modal */}
      {isCalling && (
        <VideoCallModal
          socket={socket}
          currentUser={currentUser}
          targetUser={incomingCall ? null : activeChat}
          callData={incomingCall}
          isInitiator={!incomingCall}
          isVideo={isVideoCall}
          onEndCall={() => {
            setIsCalling(false);
            setIncomingCall(null);
          }}
        />
      )}
    </div>
  );
}
