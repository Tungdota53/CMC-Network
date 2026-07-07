"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationList from '../../components/chat/conversations/ConversationList';
import EmptyConversation from '../../components/chat/conversations/EmptyConversation';
import ChatHeader from '../../components/chat/header/ChatHeader';
import MessageArea from '../../components/chat/messages/MessageArea';
import MessageInput from '../../components/chat/input/MessageInput';
import InfoPanel from '../../components/chat/info-panel/InfoPanel';
import { User, Message, Conversation } from '../../components/chat/types';

const CHAT_API_URL = '/api';
const getChatSocketUrl = () => process.env.NEXT_PUBLIC_CHAT_SOCKET_URL;

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
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const selectConversation = useCallback(async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsInfoPanelOpen(false);

    const response = await fetch(`${CHAT_API_URL}/chat/messages/${conversation.id}`);
    if (!response.ok) return;

    setMessages(await response.json());
  }, []);

  const loadConversations = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${CHAT_API_URL}/chat/conversations/${userId}`);
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

        socket = io(socketUrl);
        socketRef.current = socket;
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

    socket.on(eventName, handleNewMessage);
    return () => {
      socket.off(eventName, handleNewMessage);
    };
  }, [selectedConversation]);

  const handleSend = () => {
    if (!messageInput.trim() || !currentUser || !selectedConversation || !socketRef.current) return;

    const receiverId = selectedConversation.otherMembers[0]?.userId;
    socketRef.current.emit('sendMessage', {
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      receiverId,
      content: messageInput.trim(),
    });
    setMessageInput('');
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

  const filteredConversations = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((conversation) => conversation.title.toLowerCase().includes(keyword));
  }, [conversations, searchText]);

  return (
    <div className="h-[calc(100vh-80px)] flex rounded-3xl overflow-hidden border border-white/40 bg-white/40 shadow-[0_8px_40px_rgb(0,0,0,0.08)] backdrop-blur-2xl">
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        searchText={searchText}
        setSearchText={setSearchText}
        loading={loading}
        currentUser={currentUser}
        selectConversation={selectConversation}
        formatMessageTime={formatMessageTime}
        getAvatar={getAvatar}
      />

      <div className={`flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-white/40 to-white/60 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            <ChatHeader
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
              getAvatar={getAvatar}
              onToggleInfoPanel={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
            />

            <MessageArea
              messages={messages}
              currentUser={currentUser}
              selectedConversation={selectedConversation}
              formatMessageTime={formatMessageTime}
              getAvatar={getAvatar}
              messagesEndRef={messagesEndRef}
            />

            <MessageInput
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              handleSend={handleSend}
              handleSendThumbsUp={handleSendThumbsUp}
            />
          </>
        ) : (
          <EmptyConversation />
        )}
      </div>

      <AnimatePresence>
        {selectedConversation && isInfoPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden hidden lg:block border-l border-white/40"
          >
            <InfoPanel
              selectedConversation={selectedConversation}
              getAvatar={getAvatar}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
