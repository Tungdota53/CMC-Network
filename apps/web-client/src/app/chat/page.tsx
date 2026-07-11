"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationList from '../components/chat/conversations/ConversationList';
import EmptyConversation from '../components/chat/conversations/EmptyConversation';
import ChatHeader from '../components/chat/header/ChatHeader';
import MessageArea from '../components/chat/messages/MessageArea';
import MessageInput from '../components/chat/input/MessageInput';
import InfoPanel from '../components/chat/info-panel/InfoPanel';
import NewChatModal from '../components/chat/modals/NewChatModal';
import { User, Message, Conversation } from '../components/chat/types';
import { apiFetch, getChatSocketUrl } from '../lib/api';

const CHAT_API_URL = '/api';

const formatMessageTime = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const getAvatar = (id: string, avatarUrl?: string | null) => avatarUrl || `https://i.pravatar.cc/150?u=${id}`;

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [localReactions, setLocalReactions] = useState<Record<string, Array<{ emoji: string; userId: string; userName?: string }>>>({});
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const router = useRouter();

  // Keep ref in sync
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const selectConversation = useCallback(async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsInfoPanelOpen(false);
    setTypingUsers([]);
    setReplyingTo(null);

    const response = await apiFetch(`${CHAT_API_URL}/chat/messages/${conversation.id}`);
    if (!response.ok) return;

    const data = await response.json();
    setMessages(data);

    // Mark as read
    const info = localStorage.getItem('user_info');
    if (info) {
      const user = JSON.parse(info);
      apiFetch(`${CHAT_API_URL}/chat/messages/${conversation.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      // Clear unread badge
      setConversations((prev) => prev.map((c) => c.id === conversation.id ? { ...c, unreadCount: 0 } : c));
    }
  }, []);

  const loadConversations = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await apiFetch(`${CHAT_API_URL}/chat/conversations/${userId}`);
      if (!response.ok) return;

      const data = await response.json();
      setConversations(data);

      const searchParams = new URLSearchParams(window.location.search);
      const targetId = searchParams.get('conversationId');

      if (targetId) {
        const target = data.find((c: Conversation) => c.id === targetId);
        if (target) selectConversation(target);
        else if (data.length > 0) selectConversation(data[0]);
      } else if (data.length > 0) {
        selectConversation(data[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectConversation]);

  useEffect(() => {
    const info = localStorage.getItem('user_info');
    if (!info) return;

    let socket: Socket | null = null;
    window.setTimeout(() => {
      try {
        const user = JSON.parse(info);
        setCurrentUser(user);
        loadConversations(user.id);

        const socketUrl = getChatSocketUrl();
        if (!socketUrl) return;

        socket = io(socketUrl, { transports: ['websocket'], query: { userId: user.id } });
        socketRef.current = socket;

        // Presence: online users list
        socket.on('onlineUsers', (users: string[]) => setOnlineUsers(users));
        socket.on('presence', ({ userId, status }: { userId: string; status: string }) => {
          setOnlineUsers((prev) => status === 'online' ? [...new Set([...prev, userId])] : prev.filter((id) => id !== userId));
        });
      } catch {
        setLoading(false);
      }
    }, 0);

    return () => {
      socket?.disconnect();
    };
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedConversation) return;

    const eventName = `conversation-${selectedConversation.id}`;
    const handleNewMessage = (message: Message) => {
      setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
      setConversations((prev) => prev.map((conversation) => conversation.id === message.conversationId
        ? { ...conversation, lastMessage: message, updatedAt: message.createdAt }
        : conversation,
      ));
    };

    // Typing indicator
    const typingEvent = `typing-${selectedConversation.id}`;
    const handleTyping = ({ typingUsers: users }: { conversationId: string; typingUsers: string[] }) => {
      setTypingUsers(users.filter((id) => id !== currentUser?.id));
    };

    // Message status updates
    const statusEvent = `messageStatus-${selectedConversation.id}`;
    const handleStatus = ({ messageId, status, readerId }: { messageId?: string; status: string; readerId?: string }) => {
      if (status === 'READ' && readerId) {
        setMessages((prev) => prev.map((m) => m.senderId === currentUser?.id ? { ...m, status: 'READ' } : m));
      } else if (messageId) {
        setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, status: status as Message['status'] } : m));
      }
    };

    // Message recalled
    const handleRecall = ({ conversationId, messageId, message }: { conversationId: string; messageId: string; message: Message }) => {
      if (conversationId === selectedConversation.id) {
        setMessages((prev) => prev.map((m) => m.id === messageId ? message : m));
      }
    };

    // Reaction added
    const handleReactionAdded = ({ messageId, reaction }: { messageId: string; reaction: any }) => {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions: [...(m.reactions || []), reaction] } : m));
    };

    // Reaction removed
    const handleReactionRemoved = ({ messageId, userId, emoji }: { messageId: string; userId: string; emoji: string }) => {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions: (m.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) } : m));
    };

    socket.on(eventName, handleNewMessage);
    socket.on(typingEvent, handleTyping);
    socket.on(statusEvent, handleStatus);
    socket.on('messageRecalled', handleRecall);
    socket.on(`reactionAdded-${selectedConversation.id}`, handleReactionAdded);
    socket.on(`reactionRemoved-${selectedConversation.id}`, handleReactionRemoved);
    return () => {
      socket.off(eventName, handleNewMessage);
      socket.off(typingEvent, handleTyping);
      socket.off(statusEvent, handleStatus);
      socket.off('messageRecalled', handleRecall);
      socket.off(`reactionAdded-${selectedConversation.id}`, handleReactionAdded);
      socket.off(`reactionRemoved-${selectedConversation.id}`, handleReactionRemoved);
    };
  }, [selectedConversation, currentUser?.id]);

  // Listen for incoming messages from other conversations (for unread badge)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !currentUser) return;

    const handleReceiveMessage = (message: Message) => {
      const current = selectedConversationRef.current;
      if (current && current.id === message.conversationId) return;

      setConversations((prev) => prev.map((c) =>
        c.id === message.conversationId
          ? { ...c, lastMessage: message, updatedAt: message.createdAt, unreadCount: (c.unreadCount ?? 0) + 1 }
          : c,
      ));
    };

    socket.on(`receiveMessage-${currentUser.id}`, handleReceiveMessage);
    return () => {
      socket.off(`receiveMessage-${currentUser.id}`, handleReceiveMessage);
    };
  }, [currentUser]);

  const handleSend = () => {
    if (!messageInput.trim() || !currentUser || !selectedConversation || !socketRef.current) return;

    const receiverId = selectedConversation.otherMembers[0]?.userId;
    socketRef.current.emit('sendMessage', {
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      receiverId,
      content: messageInput.trim(),
      ...(replyingTo ? { replyToId: replyingTo.id } : {}),
    });
    setMessageInput('');
    setReplyingTo(null);

    // Stop typing
    socketRef.current.emit('typing', { conversationId: selectedConversation.id, userId: currentUser.id, isTyping: false });
  };

  const handleSendThumbsUp = () => {
    if (!currentUser || !selectedConversation || !socketRef.current) return;
    const receiverId = selectedConversation.otherMembers[0]?.userId;
    socketRef.current.emit('sendMessage', {
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      receiverId,
      content: '👍',
    });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!currentUser || !selectedConversation || !socketRef.current) return;
    socketRef.current.emit('typing', { conversationId: selectedConversation.id, userId: currentUser.id, isTyping });
  };

  const handleRecall = (messageId: string) => {
    if (!currentUser || !selectedConversation || !socketRef.current) return;
    const receiverId = selectedConversation.otherMembers[0]?.userId;
    socketRef.current.emit('recallMessage', { messageId, userId: currentUser.id, conversationId: selectedConversation.id, receiverId });
  };

  const handleFileUpload = async (file: File) => {
    if (!currentUser || !selectedConversation || !socketRef.current) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const messageType = isImage ? 'image' : isVideo ? 'video' : 'file';
    const receiverId = selectedConversation.otherMembers[0]?.userId;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${getChatSocketUrl()}/chat/upload`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }, body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();

      socketRef.current?.emit('sendMessage', {
        conversationId: selectedConversation.id,
        senderId: currentUser.id,
        receiverId,
        content: isImage ? '' : `Đã gửi tệp: ${file.name}`,
        messageType,
        mediaUrl: url,
      });
    } catch {
      toast.error('Không thể tải lên tệp');
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    // Local-only reactions (UI state)
    setLocalReactions((prev) => {
      const existing = prev[messageId] || [];
      const alreadyReacted = existing.find((r) => r.userId === currentUser.id && r.emoji === emoji);
      if (alreadyReacted) {
        // Toggle off
        return { ...prev, [messageId]: existing.filter((r) => !(r.userId === currentUser.id && r.emoji === emoji)) };
      }
      return { ...prev, [messageId]: [...existing, { emoji, userId: currentUser.id, userName: currentUser.fullName }] };
    });
  };

  const handleForward = (message: Message) => {
    toast.success('Tính năng chuyển tiếp sẽ sớm ra mắt!');
  };

  const handleStartNewChat = async (targetUser: User) => {
    if (!currentUser) return;
    setShowNewChat(false);
    try {
      const response = await apiFetch(`${CHAT_API_URL}/chat/conversations/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1Id: currentUser.id, user2Id: targetUser.id }),
      });
      if (!response.ok) return;
      const conversation = await response.json();
      await loadConversations(currentUser.id);
      const newConv: Conversation = {
        ...conversation,
        title: targetUser.fullName,
        avatarUrl: targetUser.avatarUrl,
        otherMembers: [{ userId: targetUser.id, user: targetUser }],
        lastMessage: null,
        unreadCount: 0,
      };
      selectConversation(newConv);
    } catch {
      toast.error('Không thể tạo đoạn chat');
    }
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    if (!currentUser) return;
    setShowNewChat(false);
    try {
      const response = await apiFetch(`${CHAT_API_URL}/chat/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: currentUser.id, name, memberIds }),
      });
      if (!response.ok) return;
      await loadConversations(currentUser.id);
      toast.success('Đã tạo nhóm thành công!');
    } catch {
      toast.error('Không thể tạo nhóm');
    }
  };

  // Merge local reactions into messages
  const messagesWithReactions = useMemo(() => {
    return messages.map((msg) => ({
      ...msg,
      reactions: [...(msg.reactions || []), ...(localReactions[msg.id] || [])],
    }));
  }, [messages, localReactions]);

  const filteredConversations = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((conversation) => conversation.title.toLowerCase().includes(keyword));
  }, [conversations, searchText]);

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden">
      <ConversationList
        conversations={filteredConversations}
        selectedConversation={selectedConversation}
        searchText={searchText}
        setSearchText={setSearchText}
        loading={loading}
        currentUser={currentUser}
        selectConversation={selectConversation}
        formatMessageTime={formatMessageTime}
        getAvatar={getAvatar}
        onlineUsers={onlineUsers}
        onNewChat={() => setShowNewChat(true)}
      />

      <div className={`flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50/50 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            <ChatHeader
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
              getAvatar={getAvatar}
              onToggleInfoPanel={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
              isOnline={onlineUsers.includes(selectedConversation.otherMembers[0]?.userId ?? '')}
              typingUsers={typingUsers}
              socket={socketRef.current}
              currentUser={currentUser}
            />

            <MessageArea
              messages={messagesWithReactions}
              currentUser={currentUser}
              selectedConversation={selectedConversation}
              formatMessageTime={formatMessageTime}
              getAvatar={getAvatar}
              messagesEndRef={messagesEndRef}
              onRecall={handleRecall}
              onReply={handleReply}
              onReact={handleReact}
              onForward={handleForward}
            />

            <MessageInput
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              handleSend={handleSend}
              handleSendThumbsUp={handleSendThumbsUp}
              onTyping={handleTyping}
              onFileUpload={handleFileUpload}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
            />
          </>
        ) : (
          <EmptyConversation onNewChat={() => setShowNewChat(true)} />
        )}
      </div>

      <AnimatePresence>
        {selectedConversation && isInfoPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden hidden lg:block border-l border-slate-100"
          >
            <InfoPanel
              selectedConversation={selectedConversation}
              getAvatar={getAvatar}
              onlineUsers={onlineUsers}
              messages={messages}
              onUpdateBackground={async (url) => {
                const res = await apiFetch(`${CHAT_API_URL}/chat/conversations/${selectedConversation.id}/background`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ backgroundUrl: url }),
                });
                if (res.ok) {
                  setSelectedConversation({ ...selectedConversation, backgroundUrl: url });
                  setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, backgroundUrl: url } : c));
                  toast.success('Đã cập nhật ảnh nền');
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showNewChat && (
        <NewChatModal
          currentUser={currentUser}
          onClose={() => setShowNewChat(false)}
          onStartDirect={handleStartNewChat}
          onCreateGroup={handleCreateGroup}
        />
      )}
    </div>
  );
}
