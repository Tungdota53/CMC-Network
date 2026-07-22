'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BellOff, Image as ImageIcon, Info, Palette, Phone, Pin, Search, Smile, Type, Video, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/lib/api';
import { MessageArea } from '@/components/chat/messages/MessageArea';
import { MessageInput } from '@/components/chat/input/MessageInput';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useCall } from '@/components/chat/call/CallProvider';
import { useAuthStore } from '@/store/authStore';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { socket, isConnected } = useChatSocket();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const call = useCall();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);
  const [forwardConversations, setForwardConversations] = useState<any[]>([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isNicknameOpen, setIsNicknameOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [themeColor, setThemeColor] = useState('blue');
  const [quickEmoji, setQuickEmoji] = useState('👍');
  const [isMuted, setIsMuted] = useState(false);
  const [panelMode, setPanelMode] = useState<'menu' | 'emoji' | 'search' | 'pins' | 'media'>('menu');
  const [searchText, setSearchText] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [pinsLoading, setPinsLoading] = useState(false);
  const tempIdCounter = useRef(0);

  const [conversation, setConversation] = useState<any>({
    id,
    name: 'Đang tải...',
    avatarUrl: null,
    isOnline: false,
    lastActive: ''
  });

  useEffect(() => {
    if (!id) return;
    setNickname(localStorage.getItem(`chat:nickname:${id}`) || '');
    setThemeColor(localStorage.getItem(`chat:theme:${id}`) || 'blue');
    setQuickEmoji(localStorage.getItem(`chat:emoji:${id}`) || '👍');
    setIsMuted(localStorage.getItem(`chat:muted:${id}`) === 'true');
  }, [id]);

  const saveNickname = () => {
    const trimmed = nickname.trim();
    const oldName = localStorage.getItem(`chat:nickname:${id}`) || conversation.name;
    localStorage.setItem(`chat:nickname:${id}`, trimmed);
    setIsNicknameOpen(false);
    const actorName = (user as any)?.fullName || 'Ai đó';
    const newName = trimmed || conversation.name;
    handleSendMessage(`${actorName} đã đổi biệt danh từ "${oldName}" thành "${newName}".`, undefined, 'system');
  };

  const saveThemeColor = (color: string) => {
    setThemeColor(color);
    localStorage.setItem(`chat:theme:${id}`, color);
    const actorName = (user as any)?.fullName || 'Ai đó';
    handleSendMessage(`${actorName} đã đổi chủ đề đoạn chat.`, undefined, 'system');
  };

  const themeClass = {
    blue: 'from-blue-500 to-indigo-500',
    purple: 'from-violet-500 to-fuchsia-500',
    green: 'from-emerald-500 to-teal-500',
    orange: 'from-orange-500 to-rose-500',
  }[themeColor] || 'from-blue-500 to-indigo-500';

  const chatThemeClass = {
    blue: 'bg-[linear-gradient(180deg,#07162f_0%,#07111f_42%,#050914_100%)]',
    purple: 'bg-[linear-gradient(180deg,#25123f_0%,#180d2a_42%,#090613_100%)]',
    green: 'bg-[linear-gradient(180deg,#063024_0%,#071f1a_42%,#04100e_100%)]',
    orange: 'bg-[linear-gradient(180deg,#3a1c0a_0%,#241207_42%,#100905_100%)]',
  }[themeColor] || 'bg-[linear-gradient(180deg,#07162f_0%,#07111f_42%,#050914_100%)]';

  const mediaMessages = messages.filter((message) => {
    const type = (message.messageType || message.type || '').toString().toLowerCase();
    return ['image', 'video', 'file', 'audio'].includes(type) || Boolean(message.mediaUrl);
  });

  const searchResults = searchText.trim()
    ? messages.filter((message) => (message.content || message.text || '').toLowerCase().includes(searchText.trim().toLowerCase()))
    : [];

  // ============================================================
  // 1. FETCH — Load conversation + messages via REST
  // ============================================================
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        const [convRes, msgsRes] = await Promise.all([
          api.get(`/conversations/${id}`),
          api.get(`/conversations/${id}/messages`)
        ]);
        
        const convData = convRes.data.data;
        const msgsData = msgsRes.data.data;
        const messageList = Array.isArray(msgsData) ? msgsData : (msgsData.messages || []);
        
        // Format messages: mark isOwn, reverse (backend sends newest-first)
        const formattedMessages = messageList.map((m: any) => ({
          ...m,
          isOwn: user ? m.senderId === user.id : false
        })).reverse();
        setMessages(formattedMessages); 
        
        if (convData) {
          let displayAvatar = convData.avatarUrl || convData.avatar;
          let displayName = convData.name;
          let otherUserId: string | null = null;
          
          if (convData.type === 'DIRECT' && convData.members) {
            // Find the OTHER member (not me) for display name/avatar
            const otherMember = convData.members.find(
              (m: any) => m.userId !== user?.id
            );
            if (otherMember) {
              otherUserId = otherMember.userId;
              if (otherMember.user) {
                displayName = otherMember.user.fullName;
                displayAvatar = otherMember.user.avatarUrl;
              }
            }
          }

          setConversation({
            id: convData.id,
            type: convData.type,
            name: displayName || 'Không tên',
            avatarUrl: displayAvatar,
            otherUserId,
            isOnline: true,
            lastActive: 'Đang hoạt động'
          });
        }
      } catch (error) {
        console.error('Failed to fetch chat data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id && userId) {
      fetchChatData();
    }
  }, [id, userId]);

  // ============================================================
  // 2. SOCKET — Join room + listen for real-time events
  // ============================================================
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('[Chat] Socket connected, joining room:', id);
    socket.emit('join_conversation', { conversationId: id });

    const handleNewMessage = (payload: any) => {
      if (payload.conversationId !== id) return;
      
      setMessages(prev => {
        // Deduplicate: skip if message already exists
        if (prev.some(m => m.id === payload.message.id)) {
          return prev;
        }

        // Handle optimistic message race condition
        if (user && payload.message.senderId === user.id) {
          const pendingIdx = prev.findIndex(m => m.status === 'SENDING' && m.content === payload.message.content);
          if (pendingIdx !== -1) {
            const newArr = [...prev];
            newArr[pendingIdx] = { ...payload.message, isOwn: true, status: 'SENT' };
            return newArr;
          }
        }

        const msg = { ...payload.message };
        msg.isOwn = user ? msg.senderId === user.id : false;
        return [...prev, msg];
      });
    };

    const handleLegacyConversationMessage = (message: any) => {
      handleNewMessage({ conversationId: id, message });
    };

    // Handle message updates (edits, link previews)
    const handleMessageUpdated = (payload: any) => {
      if (payload.conversationId !== id) return;
      setMessages(prev => prev.map(m => 
        m.id === payload.messageId 
          ? { ...m, ...payload.changes, isEdited: true } 
          : m
      ));
    };

    // Handle unsent messages
    const handleMessageUnsent = (payload: any) => {
      if (payload.conversationId !== id) return;
      setMessages(prev => prev.map(m => 
        m.id === payload.messageId 
          ? { ...m, isUnsent: true, content: 'Tin nhắn đã bị thu hồi' } 
          : m
      ));
    };

    // Handle reactions
    const handleMessageReacted = (payload: any) => {
      if (payload.conversationId !== id) return;
      setMessages(prev => prev.map(m => {
        if (m.id !== payload.messageId) return m;
        const newReactions = [...(m.reactions || [])];
        const existingIdx = newReactions.findIndex(r => r.userId === payload.reaction.userId);
        if (existingIdx >= 0) newReactions[existingIdx] = payload.reaction;
        else newReactions.push(payload.reaction);
        return { ...m, reactions: newReactions };
      }));
    };

    const handleReactionRemoved = (payload: any) => {
      if (payload.conversationId !== id) return;
      setMessages(prev => prev.map(m => {
        if (m.id !== payload.messageId) return m;
        return { 
          ...m, 
          reactions: (m.reactions || []).filter((r: any) => r.userId !== payload.userId) 
        };
      }));
    };

    socket.on('new_message', handleNewMessage);
    socket.on(`conversation-${id}`, handleLegacyConversationMessage);
    if (user?.id) socket.on(`receiveMessage-${user.id}`, handleLegacyConversationMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('message_unsent', handleMessageUnsent);
    socket.on('message_reacted', handleMessageReacted);
    socket.on('reaction_removed', handleReactionRemoved);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off(`conversation-${id}`, handleLegacyConversationMessage);
      if (user?.id) socket.off(`receiveMessage-${user.id}`, handleLegacyConversationMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('message_unsent', handleMessageUnsent);
      socket.off('message_reacted', handleMessageReacted);
      socket.off('reaction_removed', handleReactionRemoved);
    };
    }, [socket, isConnected, id, userId]);

  // ============================================================
  // 3. SEND — Optimistic update + socket emit with ACK callback
  // Plan: temp message (SENDING) → emit → ACK → replace (SENT)
  //        If fail → status: FAILED
  // ============================================================
  const handleSendMessage = async (text: string, replyToId?: string, typeOverride = 'TEXT') => {
    const tempId = `tmp-${++tempIdCounter.current}`;
    const tempMessage = {
      id: tempId,
      senderId: user?.id || 'unknown',
      content: text,
      type: typeOverride.toUpperCase(),
      messageType: typeOverride.toLowerCase(),
      createdAt: new Date().toISOString(),
      isOwn: true,
      status: 'SENDING',
      replyToId: replyToId || null
    };
    
    // Step 1: Show immediately (optimistic)
    setMessages(prev => [...prev, tempMessage]);

    if (socket && isConnected) {
      // Step 2: Send via socket with ACK callback
      socket.emit('send_message', {
        conversationId: id,
        content: text,
          type: typeOverride,
        tempId: tempId,
        replyToId: replyToId || null
      }, (ack: any) => {
        // Step 3: NestJS @SubscribeMessage returns ACK here
        if (ack?.data?.message) {
          const savedMessage = { ...ack.data.message };
          savedMessage.isOwn = true;
          savedMessage.status = 'SENT';
          setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
        } else {
          // ACK error or no message returned — mark as FAILED
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
        }
      });
    } else {
      // REST fallback
      try {
        const res = await api.post(`/conversations/${id}/messages`, {
          conversationId: id,
          content: text,
          type: typeOverride
        });
        
        const savedMessage = { ...res.data.data };
        savedMessage.isOwn = true;
        savedMessage.status = 'SENT';
        setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
      }
    }
  };

  const getMessageTypeFromFile = (file: File) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const handleSendMedia = async (file: File, replyToId?: string) => {
    const tempId = `${Date.now()}-${file.name}`;
    const type = getMessageTypeFromFile(file);
    const tempMessage = {
      id: tempId,
      senderId: user?.id || 'unknown',
      content: file.name,
      type: type.toUpperCase(),
      messageType: type,
      mediaUrl: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
      isOwn: true,
      status: 'SENDING',
      replyToId: replyToId || null
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/chat/upload', formData);
      const mediaUrl = uploadRes.data?.url || uploadRes.data?.data?.url;

      if (!mediaUrl) {
        throw new Error('Upload không trả về mediaUrl');
      }

      if (socket && isConnected) {
        socket.emit('send_message', {
          conversationId: id,
          content: file.name,
          type,
          mediaUrl,
          tempId,
          replyToId: replyToId || null
        }, (ack: any) => {
          if (ack?.data?.message) {
            const savedMessage = { ...ack.data.message, isOwn: true, status: 'SENT' };
            setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
          } else {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
          }
        });
      } else {
        const res = await api.post(`/conversations/${id}/messages`, {
          content: file.name,
          type,
          mediaUrl,
          replyToId: replyToId || null
        });
        const savedMessage = { ...res.data.data, isOwn: true, status: 'SENT' };
        setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
      }
    } catch (error) {
      console.error('Failed to send media:', error);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
    }
  };

  // ============================================================
  // 4. ACTION HANDLERS
  // ============================================================
  const handleReply = (msg: any) => setReplyingTo(msg);

  const handleUnsend = (messageId: string) => {
    if (!socket || !isConnected) return;
    // Optimistic UI update
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isUnsent: true } : m));
    socket.emit('unsend_message', { conversationId: id, messageId });
  };

  const handleDeleteForMe = (messageId: string) => {
    if (!socket || !isConnected) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    socket.emit('delete_message_for_me', { messageId });
  };

  const handleReact = (messageId: string, reactionType: string) => {
    if (!socket || !isConnected || !user) return;
    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const newReactions = [...(m.reactions || [])];
      const existingIdx = newReactions.findIndex((r: any) => r.userId === user.id);
      const mockReaction = { userId: user.id, reactionType, type: reactionType };
      if (existingIdx >= 0) newReactions[existingIdx] = mockReaction;
      else newReactions.push(mockReaction);
      return { ...m, reactions: newReactions };
    }));
    socket.emit('react_message', { conversationId: id, messageId, reactionType });
  };

  const handleRemoveReaction = (messageId: string) => {
    if (!socket || !isConnected || !user) return;
    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      return { ...m, reactions: (m.reactions || []).filter((r: any) => r.userId !== user.id) };
    }));
    socket.emit('remove_reaction', { conversationId: id, messageId });
  };

  const handleForward = (messageId: string) => {
    setForwardMessageId(messageId);
    setForwardLoading(true);
    api.get('/conversations')
      .then(res => {
        const items = res.data?.data || [];
        setForwardConversations(items.filter((item: any) => item.id !== id));
      })
      .catch(error => {
        console.error('Failed to load conversations for forward:', error);
        setForwardConversations([]);
      })
      .finally(() => setForwardLoading(false));
  };

  const handleForwardToConversation = (targetConversationId: string) => {
    if (!socket || !isConnected || !forwardMessageId) return;
    const tempId = `fwd-${++tempIdCounter.current}`;
    socket.emit('forward_message', {
      messageId: forwardMessageId,
      targetConversationId,
      tempId
    });
    setForwardMessageId(null);
  };

  const handleEdit = (msg: any) => {
    if (!socket || !isConnected) return;
    const content = window.prompt('Chỉnh sửa tin nhắn', msg.content || msg.text || '');
    if (!content || content.trim() === (msg.content || msg.text || '').trim()) return;

    setMessages(prev => prev.map(m => (
      m.id === msg.id ? { ...m, content: content.trim(), isEdited: true } : m
    )));
    socket.emit('edit_message', {
      conversationId: id,
      messageId: msg.id,
      content: content.trim()
    });
  };

  const handleToggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem(`chat:muted:${id}`, String(next));
    await api.post(`/chat/conversations/${id}/state`, { isMuted: next });
    handleSendMessage(`${(user as any)?.fullName || 'Ai đó'} đã ${next ? 'tắt' : 'bật'} thông báo đoạn chat.`, undefined, 'system');
  };

  const handleSaveQuickEmoji = (emoji: string) => {
    setQuickEmoji(emoji);
    localStorage.setItem(`chat:emoji:${id}`, emoji);
    handleSendMessage(`${(user as any)?.fullName || 'Ai đó'} đã đổi emoji nhanh thành ${emoji}.`, undefined, 'system');
    setPanelMode('menu');
  };

  const handleLoadPins = async () => {
    setPanelMode('pins');
    setPinsLoading(true);
    try {
      const res = await api.get(`/chat/conversations/${id}/pins`);
      setPinnedMessages(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
      setPinnedMessages([]);
    } finally {
      setPinsLoading(false);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    await api.post(`/chat/conversations/${id}/pins/${messageId}`);
    const pinned = messages.find((message) => message.id === messageId);
    handleSendMessage(`${(user as any)?.fullName || 'Ai đó'} đã ghim một tin nhắn: "${(pinned?.content || pinned?.text || 'Nội dung media').slice(0, 80)}".`, undefined, 'system');
  };

  // ============================================================
  const conversationName = (conversation.name || 'Cuộc trò chuyện').trim() || 'Cuộc trò chuyện';
  const conversationFallback = conversationName.charAt(0).toUpperCase();

  // RENDER
  // ============================================================
  return (
    <div className={cn('relative flex h-full w-full min-w-0 flex-col overflow-hidden text-foreground', chatThemeClass)}>
      {/* Chat Header */}
      <div className="sticky top-0 z-10 flex h-[64px] shrink-0 items-center justify-between border-b border-border/30 bg-card/80 px-3 shadow-sm backdrop-blur-xl md:h-[76px] md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden md:gap-4">
          <button
            type="button"
            onClick={() => router.push('/messages')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition hover:bg-hover md:hidden"
            aria-label="Quay lại danh sách chat"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 overflow-hidden rounded-2xl p-1.5 transition-all hover:bg-hover/50 md:gap-4 md:p-2 md:-ml-2">
          <div className="relative">
            <Avatar src={conversation.avatarUrl || undefined} fallback={conversationFallback} size="md" className="h-10 w-10 shadow-sm md:h-12 md:w-12" />
            {conversation.isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card shadow-sm"></div>
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 className="truncate text-[15px] font-bold leading-tight text-foreground md:text-[17px]">{nickname || conversationName}</h2>
            <p className="truncate text-xs font-medium text-primary/80 md:text-[13px]">{nickname ? conversationName : conversation.lastActive}</p>
          </div>
          </div>
        </div>
        
        {/* ChatHeaderActions */}
        <div className="ml-2 flex shrink-0 items-center gap-1 md:gap-2">
          {conversation.type !== 'GROUP' && <button
            onClick={() =>
              conversation.otherUserId &&
              call.startCall(conversation.otherUserId, conversationName, false, conversation.avatarUrl, id)
            }
            disabled={!conversation.otherUserId || call.status !== 'idle'}
            title="Gọi thoại"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm transition-all hover:scale-105 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 md:h-10 md:w-10"
          >
            <Phone className="w-[20px] h-[20px]" fill="currentColor" strokeWidth={0} />
          </button>}
          {conversation.type !== 'GROUP' && <button
            onClick={() =>
              conversation.otherUserId &&
              call.startCall(conversation.otherUserId, conversationName, true, conversation.avatarUrl, id)
            }
            disabled={!conversation.otherUserId || call.status !== 'idle'}
            title="Gọi video"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm transition-all hover:scale-105 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 md:h-10 md:w-10"
          >
            <Video className="w-[22px] h-[22px]" fill="currentColor" strokeWidth={0} />
          </button>}
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm transition-all hover:scale-105 hover:bg-primary hover:text-white md:h-10 md:w-10"
            aria-label="Mở tùy chọn đoạn chat"
          >
            <Info className="w-[22px] h-[22px]" fill="currentColor" strokeWidth={0} />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 z-[110] flex justify-end bg-black/45 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
          <aside className="flex h-full w-full max-w-[380px] flex-col bg-card shadow-2xl md:border-l md:border-border" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-base font-bold text-foreground">Tùy chọn đoạn chat</h3>
              <button type="button" onClick={() => setShowDetails(false)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-hover" aria-label="Đóng tùy chọn">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {panelMode !== 'menu' && (
                <button type="button" onClick={() => setPanelMode('menu')} className="mb-3 inline-flex items-center gap-2 rounded-full bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-hover">
                  <ArrowLeft className="h-4 w-4" /> Quay lại
                </button>
              )}
              <div className={cn('rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg', themeClass)}>
                <div className="flex items-center gap-3">
                  <Avatar src={conversation.avatarUrl || undefined} fallback={conversationFallback} className="h-14 w-14 border-2 border-white/40" />
                  <div className="min-w-0">
                    <h4 className="truncate text-lg font-black">{nickname || conversationName}</h4>
                    <p className="truncate text-sm text-white/80">{conversation.type === 'GROUP' ? 'Nhóm chat' : 'Tin nhắn riêng'}</p>
                  </div>
                </div>
              </div>

              {panelMode === 'menu' && <div className="mt-4 space-y-2">
                <button type="button" onClick={() => setIsNicknameOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left hover:bg-hover">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Type className="h-5 w-5" /></span>
                  <span><span className="block font-semibold text-foreground">Đổi biệt danh</span><span className="text-xs text-muted-foreground">Gửi thông báo vào đoạn chat</span></span>
                </button>
                <button type="button" onClick={() => setPanelMode('emoji')} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left hover:bg-hover">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-500"><Smile className="h-5 w-5" /></span>
                  <span><span className="block font-semibold text-foreground">Đổi emoji nhanh</span><span className="text-xs text-muted-foreground">Đang dùng: {quickEmoji}</span></span>
                </button>
                <button type="button" onClick={handleToggleMute} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left hover:bg-hover">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500"><BellOff className="h-5 w-5" /></span>
                  <span><span className="block font-semibold text-foreground">{isMuted ? 'Bật thông báo' : 'Tắt thông báo'}</span><span className="text-xs text-muted-foreground">Lưu thật vào trạng thái đoạn chat</span></span>
                </button>
                <button type="button" onClick={() => setPanelMode('search')} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left hover:bg-hover">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500"><Search className="h-5 w-5" /></span>
                  <span><span className="block font-semibold text-foreground">Tìm trong đoạn chat</span><span className="text-xs text-muted-foreground">Tìm nội dung cũ</span></span>
                </button>
                <button type="button" onClick={handleLoadPins} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left hover:bg-hover">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Pin className="h-5 w-5" /></span>
                  <span><span className="block font-semibold text-foreground">Tin nhắn đã ghim</span><span className="text-xs text-muted-foreground">Xem nội dung quan trọng</span></span>
                </button>
                <button type="button" onClick={() => setPanelMode('media')} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left hover:bg-hover">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500"><ImageIcon className="h-5 w-5" /></span>
                  <span><span className="block font-semibold text-foreground">Ảnh, file, liên kết</span><span className="text-xs text-muted-foreground">Thư viện nội dung đã gửi</span></span>
                </button>
              </div>}

              {panelMode === 'emoji' && <div className="mt-4 grid grid-cols-5 gap-2 rounded-3xl border border-border bg-background p-4">
                {['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉', '✅', '💯'].map((emoji) => (
                  <button key={emoji} type="button" onClick={() => handleSaveQuickEmoji(emoji)} className={cn('h-12 rounded-2xl text-2xl hover:bg-hover', quickEmoji === emoji && 'bg-primary/10 ring-2 ring-primary')}>{emoji}</button>
                ))}
              </div>}

              {panelMode === 'search' && <div className="mt-4 space-y-3">
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Nhập nội dung cần tìm" className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
                {searchResults.map((message) => <div key={message.id} className="rounded-2xl border border-border bg-background p-3 text-sm text-foreground">{message.content || message.text}</div>)}
                {searchText && searchResults.length === 0 && <p className="text-sm text-muted-foreground">Không tìm thấy tin nhắn.</p>}
              </div>}

              {panelMode === 'pins' && <div className="mt-4 space-y-2">
                {pinsLoading ? <p className="text-sm text-muted-foreground">Đang tải tin ghim...</p> : pinnedMessages.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có tin ghim. Bấm giữ tin nhắn rồi chọn Ghim.</p> : pinnedMessages.map((pin) => <div key={pin.id} className="rounded-2xl border border-border bg-background p-3 text-sm"><p className="font-semibold text-foreground">{pin.message?.sender?.fullName || 'Người dùng'}</p><p className="mt-1 text-muted-foreground">{pin.message?.content || 'Nội dung media'}</p></div>)}
              </div>}

              {panelMode === 'media' && <div className="mt-4 grid grid-cols-2 gap-2">
                {mediaMessages.length === 0 ? <p className="col-span-2 text-sm text-muted-foreground">Chưa có ảnh, file hoặc liên kết.</p> : mediaMessages.map((message) => {
                  const type = (message.messageType || message.type || '').toString().toLowerCase();
                  return <a key={message.id} href={message.mediaUrl || '#'} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-border bg-background p-2 text-xs text-foreground hover:bg-hover">{type === 'image' && message.mediaUrl ? <img src={message.mediaUrl} alt={message.content || 'Ảnh'} className="mb-2 h-24 w-full rounded-xl object-cover" /> : <ImageIcon className="mb-2 h-8 w-8 text-primary" />}<span className="line-clamp-2">{message.content || message.mediaUrl}</span></a>;
                })}
              </div>}

              {panelMode === 'menu' && <div className="mt-5 rounded-3xl border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2 font-bold text-foreground"><Palette className="h-5 w-5 text-primary" /> Chủ đề</div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    ['blue', 'from-blue-500 to-indigo-500'],
                    ['purple', 'from-violet-500 to-fuchsia-500'],
                    ['green', 'from-emerald-500 to-teal-500'],
                    ['orange', 'from-orange-500 to-rose-500'],
                  ].map(([color, gradient]) => (
                    <button key={color} type="button" onClick={() => saveThemeColor(color)} className={cn('h-11 rounded-2xl bg-gradient-to-br ring-offset-2 ring-offset-card', gradient, themeColor === color && 'ring-2 ring-primary')} aria-label={`Đổi chủ đề ${color}`} />
                  ))}
                </div>
              </div>}
            </div>
          </aside>
        </div>
      )}

      {isNicknameOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center" onClick={() => setIsNicknameOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground">Đổi biệt danh</h3>
            <p className="mt-1 text-sm text-muted-foreground">Biệt danh lưu trên thiết bị này, không ảnh hưởng người khác.</p>
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder={conversation.name} className="mt-4 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setIsNicknameOpen(false)} className="min-h-11 rounded-2xl border border-border font-semibold hover:bg-hover">Hủy</button>
              <button type="button" onClick={saveNickname} className="min-h-11 rounded-2xl bg-primary font-semibold text-primary-foreground">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* MessageArea — Plan 02J: react-virtuoso reverse scroll */}
      <MessageArea 
        messages={messages} 
        conversationName={conversation.name} 
        isGroup={conversation.type === 'GROUP'}
        conversationAvatarUrl={conversation.avatarUrl}
        themeClassName={chatThemeClass}
        themeColor={themeColor}
        loading={loading}
        onReply={handleReply}
        onUnsend={handleUnsend}
        onDeleteForMe={handleDeleteForMe}
        onEdit={handleEdit}
        onReact={handleReact}
        onRemoveReaction={handleRemoveReaction}
        onForward={handleForward}
        onPin={handlePinMessage}
      />

      {/* MessageInput — Plan 02J: auto-resize textarea */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onSendMedia={handleSendMedia}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        transparent
        quickEmoji={quickEmoji}
      />

      {forwardMessageId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[360px] max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <h3 className="font-bold text-foreground">Chuyển tiếp tin nhắn</h3>
              <button
                className="rounded-full px-3 py-1 text-sm text-foreground/60 hover:bg-hover"
                onClick={() => setForwardMessageId(null)}
              >
                Đóng
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {forwardLoading ? (
                <div className="p-4 text-center text-sm text-foreground/60">Đang tải...</div>
              ) : forwardConversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-foreground/60">Không có cuộc trò chuyện khác</div>
              ) : (
                forwardConversations.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => handleForwardToConversation(item.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-hover"
                  >
                    <Avatar fallback={(item.title || item.name || 'C').charAt(0).toUpperCase()} className="h-9 w-9" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{item.title || item.name || 'Đoạn chat'}</div>
                      <div className="truncate text-xs text-foreground/50">Nhấn để chuyển tiếp</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
