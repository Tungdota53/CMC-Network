"use client";

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket } from '../contexts/SocketContext';
import VideoCallModal, { CallData } from './VideoCallModal';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

type User = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
};

type Reaction = {
  emoji: string;
  userId: string;
  userName?: string;
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
  replyToId?: string;
  replyTo?: Message;
  reactions?: Reaction[];
  forwardedFrom?: { senderName: string; conversationTitle?: string };
};

type ActiveChat = User & {
  conversationId: string;
  backgroundUrl?: string | null;
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showLightbox, setShowLightbox] = useState<string | null>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
    if (!isMinimized) {
      const timeoutId = window.setTimeout(() => setUnreadCount(0), 0);
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
          setActiveChat({ ...friend, conversationId: conversation.id, backgroundUrl: conversation.backgroundUrl });

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

    const handleGlobalMessage = (message: Message) => {
      const currentChat = activeChatRef.current;
      if (currentChat && currentChat.conversationId === message.conversationId) {
        setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
        if (isMinimizedRef.current) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    const handleGlobalRecall = (data: { conversationId: string; messageId: string; message: Message }) => {
      const currentChat = activeChatRef.current;
      if (currentChat && currentChat.conversationId === data.conversationId) {
        setMessages((prev) => prev.map((item) => (item.id === data.messageId ? data.message : item)));
      }
    };

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

    const handleReactionAdded = ({ messageId, reaction }: { messageId: string; reaction: any }) => {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions: [...(m.reactions || []), reaction] } : m));
    };

    const handleReactionRemoved = ({ messageId, userId, emoji }: { messageId: string; userId: string; emoji: string }) => {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions: (m.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) } : m));
    };

    socket.on(eventName, handleNewMessage);
    socket.on(`reactionAdded-${activeChat.conversationId}`, handleReactionAdded);
    socket.on(`reactionRemoved-${activeChat.conversationId}`, handleReactionRemoved);
    return () => {
      socket.off(eventName, handleNewMessage);
      socket.off(`reactionAdded-${activeChat.conversationId}`, handleReactionAdded);
      socket.off(`reactionRemoved-${activeChat.conversationId}`, handleReactionRemoved);
    };
  }, [socket, activeChat]);

  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isOpen, isMinimized]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 80)}px`;
  }, [inputText]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChat || !currentUser || !socketRef.current) return;

    socketRef.current.emit('sendMessage', {
      conversationId: activeChat.conversationId,
      senderId: currentUser.id,
      receiverId: activeChat.id,
      content: inputText.trim(),
      ...(replyingTo ? { replyToId: replyingTo.id } : {}),
    });

    setInputText('');
    setReplyingTo(null);
  };

  const handleSendThumbsUp = () => {
    if (!activeChat || !currentUser || !socketRef.current) return;
    socketRef.current.emit('sendMessage', {
      conversationId: activeChat.conversationId,
      senderId: currentUser.id,
      receiverId: activeChat.id,
      content: '👍',
    });
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
      receiverId: activeChat.id,
    });
  };

  const handleToggleHeart = (messageId: string, hasReacted: boolean) => {
    if (!activeChat || !currentUser || !socketRef.current) return;
    if (hasReacted) {
      socketRef.current.emit('removeReaction', { messageId, userId: currentUser.id, emoji: '❤️' });
    } else {
      socketRef.current.emit('addReaction', { messageId, userId: currentUser.id, userName: currentUser.fullName, emoji: '❤️' });
    }
  };

  if (!currentUser || !isOpen || !activeChat) return null;

  // Minimized state — floating avatar bubble
  if (isMinimized) {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed bottom-5 right-5 z-[9999]">
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 rounded-full shadow-2xl bg-white hover:scale-110 transition-transform group relative"
          title={activeChat.fullName}
        >
          <img src={getAvatar(activeChat)} className="w-full h-full rounded-full object-cover" alt="" />
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>
      </div>,
      document.body
    );
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="fixed bottom-0 right-4 md:right-6 z-[9999]">
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="w-[340px] h-[460px] bg-white border border-slate-200 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden"
        >
          {/* Header */}
        <div className="px-3 py-2.5 flex justify-between items-center border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img src={getAvatar(activeChat)} className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" alt="" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-[14px] truncate leading-tight">{activeChat.fullName}</p>
              <p className="text-[11px] text-emerald-600 font-medium">Đang hoạt động</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              className="w-8 h-8 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors"
              title="Gọi thoại"
              onClick={() => { setIsCalling(true); setIsVideoCall(false); }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            </button>
            <button
              className="w-8 h-8 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors"
              title="Gọi video"
              onClick={() => { setIsCalling(true); setIsVideoCall(true); }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </button>
            <button
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              onClick={() => setIsMinimized(true)}
              title="Thu nhỏ"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 12H4"/></svg>
            </button>
            <button
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              onClick={() => setIsOpen(false)}
              title="Đóng"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div 
          className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5 custom-scrollbar relative bg-cover bg-center"
          style={activeChat.backgroundUrl ? { backgroundImage: `url(${activeChat.backgroundUrl})` } : { backgroundColor: 'rgb(248, 250, 252, 0.5)' }}
        >
          {activeChat.backgroundUrl && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] pointer-events-none" />}
          
          <div className="relative z-10 flex flex-col gap-0.5 min-h-full">
            {/* Conversation intro */}
            <div className="flex flex-col items-center text-center pb-4 pt-2">
              <img src={getAvatar(activeChat)} className="w-14 h-14 rounded-full object-cover mb-2 ring-4 ring-white shadow-md" alt="" />
              <p className="font-bold text-slate-800 text-[14px]">{activeChat.fullName}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">CMC Network Messenger</p>
            </div>

          {messages.map((message, index) => {
            const isMe = message.senderId === currentUser.id;
            const isRecalled = message.messageType === 'recalled';
            const isImage = message.messageType === 'image';
            const isFile = message.messageType === 'file';
            const isVideo = message.messageType === 'video';
            const prev = messages[index - 1];
            const next = messages[index + 1];
            const isSameSenderAsNext = next?.senderId === message.senderId;
            const isSameSenderAsPrev = prev?.senderId === message.senderId;

            // Smart border radius
            const getRadius = () => {
              if (isMe) {
                if (isSameSenderAsPrev && isSameSenderAsNext) return 'rounded-[18px] rounded-r-[6px]';
                if (isSameSenderAsPrev) return 'rounded-[18px] rounded-tr-[6px]';
                if (isSameSenderAsNext) return 'rounded-[18px] rounded-br-[6px]';
                return 'rounded-[18px]';
              }
              if (isSameSenderAsPrev && isSameSenderAsNext) return 'rounded-[18px] rounded-l-[6px]';
              if (isSameSenderAsPrev) return 'rounded-[18px] rounded-tl-[6px]';
              if (isSameSenderAsNext) return 'rounded-[18px] rounded-bl-[6px]';
              return 'rounded-[18px]';
            };

            return (
              <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg ${isSameSenderAsNext ? 'mb-[2px]' : 'mb-2'}`}>
                <div className={`max-w-[80%] relative ${getRadius()} transition-all ${
                  isRecalled
                    ? 'px-3 py-2 bg-transparent border border-dashed border-slate-200 text-slate-400 italic text-[13px]'
                    : isImage && message.mediaUrl
                      ? 'p-0.5 bg-transparent'
                      : isMe
                        ? 'px-3 py-2 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm'
                        : 'px-3 py-2 bg-white text-slate-800 border border-slate-100 shadow-sm'
                }`}>
                  {message.replyTo && (
                    <div className={`mb-1 px-2 py-1.5 rounded-lg border-l-[3px] ${isMe ? 'bg-indigo-400/20 border-indigo-300 text-indigo-100' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                      <p className="text-[10px] font-bold truncate opacity-90">{message.replyTo.senderId === currentUser.id ? 'Bạn' : activeChat.fullName}</p>
                      <p className="text-[11px] truncate opacity-80">{message.replyTo.content || 'Ảnh'}</p>
                    </div>
                  )}

                  {isRecalled ? (
                    <span className="text-[12px] flex items-center gap-1">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                      Đã thu hồi
                    </span>
                  ) : isImage && message.mediaUrl ? (
                    <img
                      src={message.mediaUrl}
                      className="max-w-full rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                      alt="Sent image"
                      onClick={() => setShowLightbox(message.mediaUrl!)}
                    />
                  ) : isVideo && message.mediaUrl ? (
                    <video src={message.mediaUrl} controls className="max-w-full rounded-2xl" />
                  ) : isFile && message.mediaUrl ? (
                    <a href={message.mediaUrl} download className={`flex items-center gap-2 text-[13px] ${isMe ? 'text-indigo-100 hover:text-white' : 'text-indigo-600 hover:text-indigo-700'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-indigo-50'}`}>
                        <svg width="14" height="14" fill="none" stroke={isMe ? 'white' : '#6366f1'} strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <span className="font-medium truncate">Tải tệp tin</span>
                    </a>
                  ) : (
                    <p className="text-[13.5px] leading-[1.5] break-words whitespace-pre-wrap">{message.content}</p>
                  )}

                  {/* Hover actions */}
                  <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-all ${isMe ? '-left-20' : '-right-20'}`}>
                    {!isRecalled && (
                      <button
                        onClick={() => {
                          const hasReacted = message.reactions?.some(r => r.userId === currentUser.id && r.emoji === '❤️');
                          handleToggleHeart(message.id, !!hasReacted);
                        }}
                        className="w-6 h-6 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
                        title="Thả tim"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      </button>
                    )}
                    {!isRecalled && (
                      <button
                        onClick={() => setReplyingTo(message)}
                        className="w-6 h-6 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all"
                        title="Trả lời"
                      >
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
                      </button>
                    )}
                    {isMe && !isRecalled && (
                      <button
                        onClick={() => handleRecall(message.id)}
                        className="w-6 h-6 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
                        title="Thu hồi"
                      >
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              {message.reactions && message.reactions.length > 0 && (
                <div className={`flex gap-0.5 ${isMe ? 'mr-1' : 'ml-1'} -mt-1.5 relative z-10`}>
                  <div className="flex bg-white/90 backdrop-blur-sm border border-slate-200 px-1.5 py-0.5 rounded-full shadow-sm text-[11px]">
                    {[...new Set(message.reactions.map(r => r.emoji))].map((emoji, i) => (
                      <span key={i}>{emoji}</span>
                    ))}
                    {message.reactions.length > 1 && <span className="ml-0.5 font-bold text-slate-500 text-[9px]">{message.reactions.length}</span>}
                  </div>
                </div>
              )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex flex-col gap-1.5">
          {replyingTo && (
            <div className="flex items-start justify-between bg-slate-50 px-3 py-2 rounded-xl mb-1">
              <div className="flex-1 min-w-0 border-l-[3px] border-indigo-400 pl-2">
                <p className="text-[11px] font-bold text-slate-700 truncate">
                  Đang trả lời {replyingTo.senderId === currentUser.id ? 'bạn' : activeChat.fullName}
                </p>
                <p className="text-[12px] text-slate-500 truncate">{replyingTo.content || 'Ảnh/Tệp tin'}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="ml-2 text-slate-400 hover:text-slate-600">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          )}
          <div className="flex items-end gap-1.5">
          <input
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 hover:bg-indigo-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors self-end"
            title="Gửi ảnh/file"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Aa"
              rows={1}
              className="w-full px-3 py-2 bg-slate-100 text-slate-800 rounded-2xl text-[13.5px] outline-none resize-none border border-transparent focus:border-indigo-300 focus:bg-white transition-all placeholder-slate-400 leading-[1.4] custom-scrollbar"
              style={{ minHeight: '36px', maxHeight: '80px' }}
            />
          </div>

          {inputText.trim() ? (
            <motion.button
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={handleSendMessage}
              className="w-8 h-8 shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-sm hover:shadow-md transition-all self-end"
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="ml-0.5">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </motion.button>
          ) : (
            <button
              onClick={handleSendThumbsUp}
              className="w-8 h-8 shrink-0 bg-slate-100 hover:bg-amber-50 rounded-lg flex items-center justify-center text-lg transition-all self-end hover:scale-110"
            >
              👍
            </button>
          )}
          </div>
        </div>

        {/* Video Call Modal */}
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
      </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center"
            onClick={() => setShowLightbox(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={showLightbox}
              className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl object-contain"
              alt="Preview"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowLightbox(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
