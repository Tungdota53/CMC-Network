"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Message, User, Conversation, Reaction } from '../types';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';

interface MessageAreaProps {
  messages: Message[];
  currentUser: User | null;
  selectedConversation: Conversation;
  formatMessageTime: (value?: string) => string;
  getAvatar: (id: string, avatarUrl?: string | null) => string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onRecall: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onForward?: (message: Message) => void;
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

function formatDateSeparator(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hôm nay';
  if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function shouldShowDateSeparator(current: Message, previous: Message | undefined) {
  if (!previous) return true;
  return new Date(current.createdAt).toDateString() !== new Date(previous.createdAt).toDateString();
}

/* ─── Reaction Bar (hiện dưới bubble khi có reactions) ─── */
function ReactionDisplay({ reactions }: { reactions: Reaction[] }) {
  if (!reactions || reactions.length === 0) return null;

  // Group by emoji
  const grouped = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, count]) => (
        <span
          key={emoji}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/90 border border-slate-200/80 text-[12px] shadow-sm backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer"
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-[10px] font-semibold text-slate-500">{count}</span>}
        </span>
      ))}
    </div>
  );
}

/* ─── Floating Action Bar (hiện khi hover tin nhắn) ─── */
function MessageActionBar({
  isMe,
  message,
  onReply,
  onReact,
  onRecall,
  onForward,
  showReactionPicker,
  setShowReactionPicker,
}: {
  isMe: boolean;
  message: Message;
  onReply?: (msg: Message) => void;
  onReact?: (msgId: string, emoji: string) => void;
  onRecall: (msgId: string) => void;
  onForward?: (msg: Message) => void;
  showReactionPicker: boolean;
  setShowReactionPicker: (v: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.9 }}
      transition={{ duration: 0.12 }}
      className={`absolute ${isMe ? 'right-0 -top-10' : 'left-10 -top-10'} z-30 flex items-center gap-0.5 bg-white rounded-xl shadow-lg border border-slate-100 px-1 py-0.5`}
    >
      {/* Reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className="w-8 h-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-slate-500 hover:text-amber-500 transition-colors"
          title="Thả cảm xúc"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </button>

        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 4 }}
              className={`absolute ${isMe ? 'right-0' : 'left-0'} bottom-full mb-1 flex items-center gap-1 bg-white rounded-full shadow-xl border border-slate-100 px-2 py-1.5`}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact?.(message.id, emoji);
                    setShowReactionPicker(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-xl hover:scale-125 hover:bg-slate-50 rounded-full transition-all"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reply */}
      <button
        onClick={() => onReply?.(message)}
        className="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center text-slate-500 hover:text-blue-500 transition-colors"
        title="Trả lời"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
      </button>

      {/* Forward */}
      <button
        onClick={() => onForward?.(message)}
        className="w-8 h-8 rounded-lg hover:bg-green-50 flex items-center justify-center text-slate-500 hover:text-green-500 transition-colors"
        title="Chuyển tiếp"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/></svg>
      </button>

      {/* Recall (only own messages) */}
      {isMe && (
        <button
          onClick={() => onRecall(message.id)}
          className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors"
          title="Thu hồi"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
        </button>
      )}
    </motion.div>
  );
}

/* ─── Image Lightbox ─── */
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        src={src}
        className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl object-contain"
        alt="Preview"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </motion.div>
  );
}

/* ─── Single Message Bubble ─── */
function MessageBubble({
  message,
  isMe,
  showAvatar,
  isSameSenderAsNext,
  currentUser,
  selectedConversation,
  formatMessageTime,
  getAvatar,
  onRecall,
  onReply,
  onReact,
  onForward,
  onImageClick,
}: {
  message: Message;
  isMe: boolean;
  showAvatar: boolean;
  isSameSenderAsNext: boolean;
  currentUser: User | null;
  selectedConversation: Conversation;
  formatMessageTime: (value?: string) => string;
  getAvatar: (id: string, avatarUrl?: string | null) => string;
  onRecall: (msgId: string) => void;
  onReply?: (msg: Message) => void;
  onReact?: (msgId: string, emoji: string) => void;
  onForward?: (msg: Message) => void;
  onImageClick: (src: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const isRecalled = message.messageType === 'recalled';
  const isImage = message.messageType === 'image';
  const isVideo = message.messageType === 'video';
  const isFile = message.messageType === 'file';

  // Border radius based on position in group
  const getBorderRadius = () => {
    if (isMe) {
      return isSameSenderAsNext
        ? 'rounded-[20px] rounded-br-[6px] rounded-tr-[6px]'
        : 'rounded-[20px] rounded-br-[6px]';
    }
    return isSameSenderAsNext
      ? 'rounded-[20px] rounded-bl-[6px] rounded-tl-[6px]'
      : 'rounded-[20px] rounded-bl-[6px]';
  };

  return (
    <div
      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isSameSenderAsNext ? 'mb-[3px]' : 'mb-3'} relative group/msg`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowReactionPicker(false); }}
    >
      {/* Avatar (left side for others) */}
      {!isMe && (
        <div className="w-8 shrink-0 self-end">
          {showAvatar && !isSameSenderAsNext ? (
            <img
              src={getAvatar(message.senderId, message.sender?.avatarUrl)}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
              alt=""
            />
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      <div className={`max-w-[65%] relative`}>
        {/* Floating action bar */}
        <AnimatePresence>
          {isHovered && !isRecalled && (
            <MessageActionBar
              isMe={isMe}
              message={message}
              onReply={onReply}
              onReact={onReact}
              onRecall={onRecall}
              onForward={onForward}
              showReactionPicker={showReactionPicker}
              setShowReactionPicker={setShowReactionPicker}
            />
          )}
        </AnimatePresence>

        {/* Forwarded label */}
        {message.forwardedFrom && (
          <div className={`flex items-center gap-1 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400" viewBox="0 0 24 24"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/></svg>
            <span className="text-[11px] font-medium text-slate-400 italic">
              Chuyển tiếp từ {message.forwardedFrom.senderName}
            </span>
          </div>
        )}

        {/* Reply preview (quoted message) */}
        {message.replyTo && (
          <div
            className={`mb-1 px-3 py-2 rounded-xl border-l-[3px] ${
              isMe
                ? 'bg-indigo-400/20 border-indigo-300 text-indigo-100'
                : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
          >
            <p className="text-[11px] font-bold truncate">
              {message.replyTo.senderId === currentUser?.id ? 'Bạn' : message.replyTo.sender?.fullName || 'Người dùng'}
            </p>
            <p className="text-[12px] truncate opacity-80">{message.replyTo.content || '📷 Ảnh'}</p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`${getBorderRadius()} transition-all duration-150 ${
            isRecalled
              ? 'px-4 py-2.5 bg-slate-50 border border-dashed border-slate-200 text-slate-400 italic'
              : isImage && message.mediaUrl
                ? 'p-1 bg-transparent'
                : isMe
                  ? 'px-4 py-2.5 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'px-4 py-2.5 bg-white text-slate-800 shadow-sm border border-slate-100/80'
          }`}
        >
          {isRecalled ? (
            <p className="text-[13px] flex items-center gap-1.5">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
              Tin nhắn đã thu hồi
            </p>
          ) : isImage && message.mediaUrl ? (
            <img
              src={message.mediaUrl}
              className="max-w-full sm:max-w-xs rounded-2xl cursor-pointer hover:opacity-90 transition-opacity object-contain bg-slate-100"
              alt="Sent image"
              onClick={() => onImageClick(message.mediaUrl!)}
            />
          ) : isVideo && message.mediaUrl ? (
            <video src={message.mediaUrl} controls className="max-w-full sm:max-w-xs rounded-2xl" />
          ) : isFile && message.mediaUrl ? (
            <a
              href={message.mediaUrl}
              download
              className={`flex items-center gap-3 px-1 py-1 ${isMe ? 'text-white' : 'text-slate-700'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-indigo-50'}`}>
                <svg width="20" height="20" fill="none" stroke={isMe ? 'white' : '#6366f1'} strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold truncate">{message.content || 'Tệp tin'}</p>
                <p className={`text-[11px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>Nhấn để tải xuống</p>
              </div>
            </a>
          ) : (
            <p className="text-[14.5px] leading-[1.55] break-words whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Reactions display */}
        <div className={`${isMe ? 'flex justify-end' : 'flex justify-start'}`}>
          <ReactionDisplay reactions={message.reactions || []} />
        </div>

        {/* Time + Status */}
        <div className={`flex items-center gap-1.5 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] font-medium text-slate-400 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            {formatMessageTime(message.createdAt)}
          </span>
          {isMe && !isRecalled && (
            <>
              {message.status === 'READ' ? (
                <span className="text-[11px] text-blue-500 font-medium flex items-center opacity-0 group-hover/msg:opacity-100 transition-opacity" title="Đã xem">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M2 12.5l5.5 5.5L18 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 12.5l5.5 5.5L24.5 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                  </svg>
                </span>
              ) : message.status === 'DELIVERED' ? (
                <span className="text-[11px] text-slate-400 flex items-center opacity-0 group-hover/msg:opacity-100 transition-opacity" title="Đã gửi">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </span>
              ) : (
                <span className="text-[11px] text-slate-300 flex items-center opacity-0 group-hover/msg:opacity-100 transition-opacity" title="Đang gửi">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20"/></svg>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main MessageArea Component ─── */
export default function MessageArea({
  messages,
  currentUser,
  selectedConversation,
  formatMessageTime,
  getAvatar,
  messagesEndRef,
  onRecall,
  onReply,
  onReact,
  onForward,
}: MessageAreaProps) {
  const router = useRouter();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleAvatarClick = () => {
    if (selectedConversation.type === 'GROUP') return;
    const otherId = selectedConversation.otherMembers?.[0]?.userId;
    if (otherId) router.push(`/profile/${otherId}`);
  };

  return (
    <div 
      className="flex-1 relative z-10 flex flex-col min-h-0 bg-gradient-to-b from-slate-50/60 via-white/30 to-slate-50/40 bg-cover bg-center"
      style={selectedConversation.backgroundUrl ? { backgroundImage: `url(${selectedConversation.backgroundUrl})` } : undefined}
    >
      {/* Subtle pattern background if no custom background */}
      {!selectedConversation.backgroundUrl && (
        <div
          className="absolute inset-0 opacity-[0.012] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #6366f1 0.5px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
      )}
      
      {/* Dim overlay if there is a background image to keep text readable */}
      {selectedConversation.backgroundUrl && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] pointer-events-none" />
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-6">
        {/* Conversation header in message area */}
        <div className="flex flex-col items-center text-center mb-8 mt-6 pt-4 relative">
          <div
            onClick={handleAvatarClick}
            className={`w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-white shadow-xl relative group ${selectedConversation.type === 'GROUP' ? '' : 'cursor-pointer'}`}
          >
            <img
              src={getAvatar(selectedConversation.id, selectedConversation.avatarUrl)}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              alt=""
            />
            {selectedConversation.type !== 'GROUP' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                <span className="text-white text-[11px] font-bold">Xem hồ sơ</span>
              </div>
            )}
          </div>
          <p className="text-slate-800 font-extrabold text-xl tracking-tight">{selectedConversation.title}</p>
          <p className="text-slate-400 font-medium text-[13px] mt-1.5">
            {selectedConversation.type === 'GROUP'
              ? `👥 ${selectedConversation.otherMembers.length + 1} thành viên`
              : '💬 CMC Network Messenger'}
          </p>
          <div className="w-8 h-[3px] bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full mt-3" />
        </div>

        {/* Messages */}
        {messages.map((message, index) => {
          const isMe = message.senderId === currentUser?.id;
          const previous = messages[index - 1];
          const next = messages[index + 1];
          const showAvatar = !isMe && previous?.senderId !== message.senderId;
          const showDateSep = shouldShowDateSeparator(message, previous);
          const isSameSenderAsNext = next?.senderId === message.senderId && !shouldShowDateSeparator(next, message);

          return (
            <div key={message.id}>
              {showDateSep && (
                <div className="flex items-center justify-center my-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-px bg-gradient-to-r from-transparent to-slate-200/60" />
                    <span className="text-[12px] font-semibold text-slate-400 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-slate-100/80">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                    <div className="w-16 h-px bg-gradient-to-l from-transparent to-slate-200/60" />
                  </div>
                </div>
              )}

              {/* Sender name for group chat */}
              {!isMe && showAvatar && selectedConversation.type === 'GROUP' && (
                <p className="text-[12px] font-semibold text-slate-500 ml-10 mb-1">
                  {message.sender?.fullName}
                </p>
              )}

              <MessageBubble
                message={message}
                isMe={isMe}
                showAvatar={showAvatar}
                isSameSenderAsNext={isSameSenderAsNext}
                currentUser={currentUser}
                selectedConversation={selectedConversation}
                formatMessageTime={formatMessageTime}
                getAvatar={getAvatar}
                onRecall={onRecall}
                onReply={onReply}
                onReact={onReact}
                onForward={onForward}
                onImageClick={(src) => setLightboxImage(src)}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
