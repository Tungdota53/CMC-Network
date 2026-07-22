import React, { useState, useEffect } from 'react';
import { MiniChatHeader } from './MiniChatHeader';
import { MessageInput } from '../input/MessageInput';
import { MessageArea } from '../messages/MessageArea';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useCall } from '@/components/chat/call/CallProvider';
import { LiveKitGroupCall } from '@/components/chat/call/LiveKitGroupCall';
import { useRouter } from 'next/navigation';

interface Props {
  conversationId: string;
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
}

export const MiniChatWindow = ({ conversationId, name, avatarUrl, isOnline, isMinimized, onClose, onToggleMinimize }: Props) => {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const { socket, isConnected } = useChatSocket();
  const call = useCall();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isGroupCallOpen, setIsGroupCallOpen] = useState(false);
  const [conversation, setConversation] = useState<any>({ name, avatarUrl, isOnline, otherUserId: null, type: 'DIRECT' });

  // 1. Fetch data
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        const [convRes, msgsRes] = await Promise.all([
          api.get(`/conversations/${conversationId}`),
          api.get(`/conversations/${conversationId}/messages`),
        ]);
        const convData = convRes.data.data;
        const msgsData = msgsRes.data.data;
        const messageList = Array.isArray(msgsData) ? msgsData : (msgsData.messages || []);
        const formattedMessages = messageList.map((m: any) => ({
          ...m,
          isOwn: user ? m.senderId === user.id : false
        })).reverse();
        setMessages(formattedMessages);

        if (convData) {
          let displayName = convData.title || convData.name || name;
          let avatarUrl = convData.avatarUrl;
          let otherUserId = null;
          if (convData.type === 'DIRECT' && convData.members) {
            const otherMember = convData.members.find((m: any) => m.userId !== user?.id);
            otherUserId = otherMember?.userId || null;
            if (otherMember?.user) {
              displayName = otherMember.user.fullName || displayName;
              avatarUrl = otherMember.user.avatarUrl || avatarUrl;
            }
          }
          setConversation({ name: displayName, avatarUrl, isOnline, otherUserId, type: convData.type });
        }
      } catch (error) {
        console.error('Failed to fetch mini chat data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (conversationId && userId) {
      fetchChatData();
    }
  }, [conversationId, userId]);

  // 2. Socket Listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('join_conversation', { conversationId });

    const handleNewMessage = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      setMessages(prev => {
        // Prevent duplicate real IDs
        if (prev.some(m => m.id === payload.message.id)) return prev;
        
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
      handleNewMessage({ conversationId, message });
    };

    const handleMessageUpdated = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      setMessages(prev => prev.map(m => m.id === payload.messageId ? { ...m, ...payload.changes } : m));
    };

    const handleMessageUnsent = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      setMessages(prev => prev.map(m => m.id === payload.messageId ? { ...m, isUnsent: true, content: 'Tin nhắn đã bị thu hồi' } : m));
    };

    const handleMessageReacted = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      setMessages(prev => prev.map(m => {
        if (m.id !== payload.messageId) return m;
        const newReactions = [...(m.reactions || [])];
        const existingIdx = newReactions.findIndex((r: any) => r.userId === payload.reaction.userId);
        if (existingIdx >= 0) newReactions[existingIdx] = payload.reaction;
        else newReactions.push(payload.reaction);
        return { ...m, reactions: newReactions };
      }));
    };

    const handleReactionRemoved = (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      setMessages(prev => prev.map(m => {
        if (m.id !== payload.messageId) return m;
        return { ...m, reactions: (m.reactions || []).filter((r: any) => r.userId !== payload.userId) };
      }));
    };

    socket.on('new_message', handleNewMessage);
    socket.on(`conversation-${conversationId}`, handleLegacyConversationMessage);
    if (user?.id) socket.on(`receiveMessage-${user.id}`, handleLegacyConversationMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('message_unsent', handleMessageUnsent);
    socket.on('message_reacted', handleMessageReacted);
    socket.on('reaction_removed', handleReactionRemoved);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off(`conversation-${conversationId}`, handleLegacyConversationMessage);
      if (user?.id) socket.off(`receiveMessage-${user.id}`, handleLegacyConversationMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('message_unsent', handleMessageUnsent);
      socket.off('message_reacted', handleMessageReacted);
      socket.off('reaction_removed', handleReactionRemoved);
    };
  }, [socket, isConnected, conversationId, userId]);

  // 3. Handlers
  const handleSendMessage = async (text: string, replyToId?: string) => {
    const tempId = Date.now().toString();
    const tempMessage = {
      id: tempId,
      senderId: user?.id || 'unknown',
      content: text,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      isOwn: true,
      status: 'SENDING',
      replyToId: replyToId || null
    };
    
    setMessages(prev => [...prev, tempMessage]);

    if (socket && isConnected) {
      socket.emit('send_message', {
        conversationId,
        content: text,
        type: 'TEXT',
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
      try {
        const res = await api.post(`/conversations/${conversationId}/messages`, {
          conversationId,
          content: text,
          type: 'TEXT'
        });
        const savedMessage = { ...res.data.data, isOwn: true, status: 'SENT' };
        setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
      } catch (error) {
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
      replyToId: replyToId || null,
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/chat/upload', formData);
      const mediaUrl = uploadRes.data?.url || uploadRes.data?.data?.url;
      if (!mediaUrl) throw new Error('Upload không trả về mediaUrl');

      const sendPayload = {
        conversationId,
        content: file.name,
        type,
        mediaUrl,
        tempId,
        replyToId: replyToId || null,
      };

      if (socket && isConnected) {
        socket.emit('send_message', sendPayload, (ack: any) => {
          if (ack?.data?.message) {
            const savedMessage = { ...ack.data.message, isOwn: true, status: 'SENT' };
            setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
          } else {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
          }
        });
      } else {
        const res = await api.post(`/conversations/${conversationId}/messages`, sendPayload);
        const savedMessage = { ...res.data.data, isOwn: true, status: 'SENT' };
        setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
      }
    } catch (error) {
      console.error('Failed to send mini chat media:', error);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
    }
  };

  const handleUnsend = (messageId: string) => {
    if (!socket || !isConnected) return;
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isUnsent: true } : m));
    socket.emit('unsend_message', { conversationId, messageId });
  };

  const handleDeleteForMe = (messageId: string) => {
    if (!socket || !isConnected) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    socket.emit('delete_message_for_me', { messageId });
  };

  const handleReact = (messageId: string, reactionType: string) => {
    if (!socket || !isConnected || !user) return;
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const newReactions = [...(m.reactions || [])];
      const existingIdx = newReactions.findIndex((r: any) => r.userId === user.id);
      if (existingIdx >= 0) newReactions[existingIdx] = { userId: user.id, reactionType, type: reactionType };
      else newReactions.push({ userId: user.id, reactionType, type: reactionType });
      return { ...m, reactions: newReactions };
    }));
    socket.emit('react_message', { conversationId, messageId, reactionType });
  };

  const handleRemoveReaction = (messageId: string) => {
    if (!socket || !isConnected || !user) return;
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      return { ...m, reactions: (m.reactions || []).filter((r: any) => r.userId !== user.id) };
    }));
    socket.emit('remove_reaction', { conversationId, messageId });
  };

  if (isMinimized) {
    const displayName = (conversation.name || name || 'Cuộc trò chuyện').trim() || 'Cuộc trò chuyện';
    const avatarFallback = displayName.charAt(0).toUpperCase();

    return (
      <div className="relative group animate-in fade-in zoom-in-95 duration-500 mb-2">
        <button 
          onClick={onToggleMinimize}
          className="w-14 h-14 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.25)] border-[1.5px] border-white/20 transition-all hover:scale-105 hover:shadow-[0_12px_40px_rgba(var(--primary-rgb),0.3)] active:scale-95 relative flex items-center justify-center bg-background/40 backdrop-blur-2xl backdrop-saturate-200 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <Avatar src={conversation.avatarUrl || avatarUrl} fallback={avatarFallback} size="lg" className="w-full h-full object-cover p-0.5 rounded-full" />
          {isOnline && (
            <div className="absolute bottom-[2px] right-[2px] w-3.5 h-3.5 bg-green-500 border-2 border-background/90 rounded-full shadow-sm z-10"></div>
          )}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] bg-background/60 backdrop-blur-xl border border-white/20 shadow-lg rounded-full text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-110 z-20"
        >
          <span className="text-[10px] font-bold">✕</span>
        </button>
      </div>
    );
  }

  return (
    <>
    {isGroupCallOpen && (
      <LiveKitGroupCall
        conversationId={conversationId}
        title={conversation.name || name}
        onClose={() => setIsGroupCallOpen(false)}
      />
    )}
    <div className="w-[360px] max-w-[calc(100vw-32px)] h-[540px] max-h-[calc(100vh-100px)] rounded-3xl flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-500 pointer-events-auto isolate relative shadow-[0_16px_60px_rgba(0,0,0,0.4)] border border-white/15 mb-4 mr-2 sm:mr-4 bg-background/50 backdrop-blur-[40px] backdrop-saturate-[200%] overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-primary/5 before:pointer-events-none before:-z-10 after:absolute after:top-0 after:inset-x-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent after:pointer-events-none">
      
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <MiniChatHeader 
          name={conversation.name || name}
          avatarUrl={conversation.avatarUrl || avatarUrl}
          isOnline={conversation.isOnline}
          onClose={onClose} 
          onMinimize={onToggleMinimize} 
          onPopOut={() => router.push(`/messages/t/${conversationId}`)}
          onCall={() => conversation.otherUserId ? call.startCall(conversation.otherUserId, conversation.name || name, false, conversation.avatarUrl, conversationId) : setIsGroupCallOpen(true)}
          onVideoCall={() => conversation.otherUserId ? call.startCall(conversation.otherUserId, conversation.name || name, true, conversation.avatarUrl, conversationId) : setIsGroupCallOpen(true)}
        />
        
        {/* Messages Area - using global component */}
        <div className="flex-1 overflow-hidden flex flex-col bg-black/5 dark:bg-white/5">
          <MessageArea 
            messages={messages} 
            conversationName={conversation.name || name} 
            isGroup={conversation.type === 'GROUP'}
            loading={loading}
            onReply={setReplyingTo}
            onUnsend={handleUnsend}
            onDeleteForMe={handleDeleteForMe}
            onReact={handleReact}
            onRemoveReaction={handleRemoveReaction}
          />
        </div>

        <div className="shrink-0 border-t border-white/10 bg-background/30 backdrop-blur-xl px-2 pb-3 pt-2">
          <MessageInput 
            onSendMessage={handleSendMessage}
            onSendMedia={handleSendMedia}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            transparent={true} 
          />
        </div>
      </div>
    </div>
    </>
  );
};
