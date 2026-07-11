"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../types';

interface MessageInputProps {
  messageInput: string;
  setMessageInput: (val: string) => void;
  handleSend: () => void;
  handleSendThumbsUp: () => void;
  onTyping: (isTyping: boolean) => void;
  onFileUpload: (file: File) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Hay dùng': ['😀', '😂', '🥰', '😍', '😎', '🤔', '😢', '😭', '😡', '😴', '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞', '👋', '🙏'],
  'Trái tim': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💝', '💘', '🫶', '🥹', '😘'],
  'Biểu tượng': ['🔥', '✨', '⭐', '🌟', '💫', '🎉', '🎊', '🎈', '🎁', '🏆', '📚', '✏️', '📝', '💡', '🎓', '🎯', '✅', '❌', '⚠️', '❓'],
  'Đồ ăn': ['☕', '🍕', '🍔', '🍟', '🍜', '🍰', '🥤', '🍺', '🍷', '🥂', '🍣', '🍿', '🧋', '🍩', '🍪', '🍫', '🥐', '🥗', '🍗', '🌮'],
};

export default function MessageInput({
  messageInput,
  setMessageInput,
  handleSend,
  handleSendThumbsUp,
  onTyping,
  onFileUpload,
  replyingTo,
  onCancelReply,
}: MessageInputProps) {
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('Hay dùng');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 120;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [messageInput, adjustTextareaHeight]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus();
  }, [replyingTo]);

  // Close popups on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleInputChange = (val: string) => {
    setMessageInput(val);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleSendWrapper = () => {
    // If there are pending files, send them first
    pendingFiles.forEach((file) => onFileUpload(file));
    clearPendingFiles();

    handleSend();
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput(messageInput + emoji);
    textareaRef.current?.focus();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      newFiles.push(file);
      if (file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        newPreviews.push('');
      }
    });

    setPendingFiles((prev) => [...prev, ...newFiles]);
    setPendingPreviews((prev) => [...prev, ...newPreviews]);

    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    if (pendingPreviews[index]) URL.revokeObjectURL(pendingPreviews[index]);
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearPendingFiles = () => {
    pendingPreviews.forEach((p) => { if (p) URL.revokeObjectURL(p); });
    setPendingFiles([]);
    setPendingPreviews([]);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      pendingPreviews.forEach((p) => { if (p) URL.revokeObjectURL(p); });
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWrapper();
    }
  };

  const hasContent = messageInput.trim() || pendingFiles.length > 0;

  return (
    <div className="bg-white/80 backdrop-blur-xl border-t border-slate-100 z-20 relative">
      {/* Reply preview bar */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-50/80 border-b border-indigo-100/50">
              <div className="w-1 h-10 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-indigo-600">
                  Trả lời {replyingTo.sender?.fullName || 'tin nhắn'}
                </p>
                <p className="text-[13px] text-slate-500 truncate">
                  {replyingTo.content || (replyingTo.messageType === 'image' ? '📷 Ảnh' : '📎 Tệp tin')}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="w-7 h-7 rounded-full hover:bg-indigo-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending files preview */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50/80 border-b border-slate-100/50 overflow-x-auto">
              {pendingFiles.map((file, index) => (
                <div key={index} className="relative shrink-0 group">
                  {pendingPreviews[index] ? (
                    <img
                      src={pendingPreviews[index]}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm"
                      alt="preview"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-slate-200 flex flex-col items-center justify-center">
                      <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span className="text-[9px] text-slate-500 mt-0.5 max-w-[56px] truncate">{file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removePendingFile(index)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-colors shrink-0"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            ref={emojiPickerRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-4 mb-2 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-30"
          >
            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Tìm emoji..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-[13px] outline-none border border-transparent focus:border-indigo-300 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 px-3 pt-2 pb-1 border-b border-slate-50 overflow-x-auto">
              {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveEmojiCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all ${
                    activeEmojiCategory === cat
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            <div className="grid grid-cols-10 gap-0.5 p-3 max-h-[180px] overflow-y-auto custom-scrollbar">
              {EMOJI_CATEGORIES[activeEmojiCategory]?.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-[30px] h-[30px] flex items-center justify-center text-xl hover:bg-indigo-50 hover:scale-125 rounded-lg transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attach Menu */}
      <AnimatePresence>
        {showAttachMenu && (
          <motion.div
            ref={attachMenuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-1.5 z-30 w-48"
          >
            <button
              onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}
              className="w-full flex items-center gap-3 p-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-sm">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800">Ảnh / Video</p>
                <p className="text-[11px] text-slate-400">Gửi media</p>
              </div>
            </button>
            <button
              onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
              className="w-full flex items-center gap-3 p-2.5 hover:bg-blue-50 rounded-xl transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800">Tệp tin</p>
                <p className="text-[11px] text-slate-400">PDF, DOC, ZIP...</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        ref={imageInputRef}
        onChange={handleImageSelect}
      />
      <input
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.ppt,.pptx"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      {/* Input area */}
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Attach button */}
        <button
          onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojis(false); }}
          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
            showAttachMenu
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
          }`}
          title="Đính kèm"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Textarea wrapper */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            placeholder="Aa"
            value={messageInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="w-full px-4 py-2.5 bg-slate-100 rounded-2xl text-[14.5px] text-slate-800 placeholder-slate-400 outline-none resize-none border border-transparent focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all leading-[1.4] custom-scrollbar"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Emoji button */}
        <button
          onClick={() => { setShowEmojis(!showEmojis); setShowAttachMenu(false); }}
          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
            showEmojis
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
          }`}
          title="Emoji"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </button>

        {/* Send / Thumbs up */}
        {hasContent ? (
          <motion.button
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            onClick={handleSendWrapper}
            className="w-10 h-10 shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="ml-0.5">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </motion.button>
        ) : (
          <button
            onClick={handleSendThumbsUp}
            className="w-10 h-10 shrink-0 bg-slate-100 hover:bg-amber-50 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110"
          >
            👍
          </button>
        )}
      </div>
    </div>
  );
}
