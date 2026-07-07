"use client";

import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import { Message, User, Conversation } from '../types';
import { useRouter } from 'next/navigation';

interface MessageAreaProps {
  messages: Message[];
  currentUser: User | null;
  selectedConversation: Conversation;
  formatMessageTime: (value?: string) => string;
  getAvatar: (id: string, avatarUrl?: string | null) => string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function MessageArea({
  messages,
  currentUser,
  selectedConversation,
  formatMessageTime,
  getAvatar,
  messagesEndRef,
}: MessageAreaProps) {
  const router = useRouter();

  const handleAvatarClick = () => {
    if (selectedConversation.type === 'GROUP') {
      // TODO: Open group info modal
      return;
    }
    const otherId = selectedConversation.otherMembers?.[0]?.userId;
    if (otherId) router.push(`/profile/${otherId}`);
  };

  return (
    <div className="flex-1 relative z-10 flex flex-col h-full bg-white/50">
      <Virtuoso
        data={messages}
        initialTopMostItemIndex={messages.length - 1}
        followOutput="smooth"
        className="custom-scrollbar"
        style={{ height: '100%' }}
        components={{
          Header: () => (
            <div className="flex flex-col items-center text-center mb-10 mt-6 pt-4">
              <div 
                onClick={handleAvatarClick} 
                className={`w-28 h-28 rounded-full overflow-hidden mb-5 border-4 border-white shadow-xl relative group ${selectedConversation.type === 'GROUP' ? '' : 'cursor-pointer'}`}
              >
                <img src={getAvatar(selectedConversation.id, selectedConversation.avatarUrl)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                {selectedConversation.type !== 'GROUP' && (
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Xem hồ sơ</span>
                  </div>
                )}
              </div>
              <p className="text-slate-800 font-extrabold text-2xl tracking-tight">{selectedConversation.title}</p>
              <p className="text-slate-500 font-medium text-[15px] mt-1.5 bg-white/60 px-4 py-1 rounded-full shadow-sm">
                {selectedConversation.type === 'GROUP' ? 'Nhóm trò chuyện' : 'CMC Network Messenger'}
              </p>
            </div>
          ),
          Footer: () => <div ref={messagesEndRef} className="h-4" />
        }}
        itemContent={(index, message) => {
          const isMe = message.senderId === currentUser?.id;
          const previous = messages[index - 1];
          const showAvatar = !isMe && previous?.senderId !== message.senderId;

          return (
            <div className="px-4 lg:px-6 pb-4">
              <div 
                className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} group/msg`}
              >
                {!isMe && (
                  <div className="w-8 shrink-0">
                    {showAvatar ? (
                      <img src={getAvatar(message.senderId, message.sender?.avatarUrl)} className="w-8 h-8 rounded-full object-cover border border-white shadow-sm" alt="" />
                    ) : (
                      <div className="w-8 h-8"></div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[75%] px-4 py-3 ${
                  isMe
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-[4px] shadow-[0_4px_15px_rgba(79,70,229,0.25)]'
                    : 'bg-white text-slate-800 rounded-2xl rounded-bl-[4px] border border-white shadow-[0_4px_15px_rgba(0,0,0,0.04)]'
                }`}>
                  <p className="text-[15px] leading-[1.5] break-words font-medium">{message.content}</p>
                </div>
                
                <span className={`text-[11px] font-semibold text-slate-400 opacity-0 group-hover/msg:opacity-100 transition-opacity mb-1 ${isMe ? 'order-first' : ''}`}>
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
