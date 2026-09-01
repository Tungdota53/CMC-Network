'use client';

import { PlusCircle, Image as ImageIcon, Sticker, Clapperboard, Smile, ThumbsUp, SendHorizontal, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (text: string, replyToId?: string) => void;
  onSendMedia?: (file: File, replyToId?: string) => void;
  replyingTo?: any;
  onCancelReply?: () => void;
  transparent?: boolean;
  quickEmoji?: string;
  onTypingChange?: (isTyping: boolean) => void;
  compact?: boolean;
}

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 4000;
const ALLOWED_UPLOAD_TYPES = [
  'image/',
  'video/',
  'audio/',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
];

function isAllowedUploadType(file: File) {
  if (!file.type) return false;
  return ALLOWED_UPLOAD_TYPES.some((type) => (
    type.endsWith('/') ? file.type.startsWith(type) : file.type === type
  ));
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {children}
    </button>
  );
}

function FileIconButton({
  children,
  label,
  accept,
  onChange,
}: {
  children: React.ReactNode;
  label: string;
  accept?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-within:ring-2 focus-within:ring-primary"
    >
      <input type="file" accept={accept} className="sr-only" onChange={onChange} />
      {children}
    </label>
  );
}

/**
 * MessageInput — Plan 02J
 * Layout: [+]  [image]  [sticker]  [GIF]  │ Aa input │  [smile]  [thumbs-up]
 * + ReplyPreview bar above input when replying
 */
export function MessageInput({ onSendMessage, onSendMedia, replyingTo, onCancelReply, transparent, quickEmoji = '👍', onTypingChange, compact = false }: MessageInputProps) {
  const [inputText, setInputText] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus input when reply starts
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTypingChange?.(false);
    };
  }, [pendingPreview, onTypingChange]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), replyingTo?.id);
    onTypingChange?.(false);
    setInputText('');
    onCancelReply?.();
    if (textareaRef.current) {
      textareaRef.current.style.height = '22px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      if (replyingTo) {
        onCancelReply?.();
      } else {
        textareaRef.current?.blur();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
    setInputText(nextValue);
    onTypingChange?.(nextValue.trim().length > 0);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTypingChange?.(false), 1800);
    if (textareaRef.current) {
      textareaRef.current.style.height = '22px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  };

  const hasText = inputText.trim().length > 0;
  const hasPendingFile = !!pendingFile;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onSendMedia) return;
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      clearPendingFile();
      setFileError('Tệp quá lớn. Vui lòng chọn tệp tối đa 50MB.');
      return;
    }
    if (!isAllowedUploadType(file)) {
      clearPendingFile();
      setFileError('Định dạng tệp chưa được hỗ trợ. Hãy gửi ảnh, video, âm thanh, PDF, tài liệu hoặc tệp ZIP.');
      return;
    }
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setFileError(null);
    setPendingFile(file);
    setPendingPreview(file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : null);
  };

  const clearPendingFile = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    setFileError(null);
  };

  const handleSendPendingFile = () => {
    if (!pendingFile || !onSendMedia) return;
    onSendMedia(pendingFile, replyingTo?.id);
    clearPendingFile();
    onCancelReply?.();
  };

  return (
    <div className={`${transparent ? 'bg-transparent' : 'bg-card/90 border-t border-border/30'} relative z-[2] w-full min-w-0 shrink-0 overflow-hidden`}>
      {/* Reply Preview — Plan 02J */}
      {replyingTo && (
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 pb-1 pt-2 animate-in slide-in-from-bottom-2 duration-150 md:px-5">
          <div className="flex-1 rounded-xl border border-border/50 bg-card/90 px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-xl">
            <div className="text-[11px] font-semibold text-primary mb-0.5">
              Đang trả lời {replyingTo.isOwn ? 'chính mình' : (replyingTo.sender?.fullName || 'tin nhắn')}
            </div>
            <div className="text-[13px] text-foreground/60 line-clamp-1">
              {replyingTo.content || replyingTo.text || ''}
            </div>
          </div>
          <button 
            onClick={onCancelReply}
            aria-label="Hủy trả lời"
            className="w-7 h-7 rounded-full hover:bg-hover flex items-center justify-center text-foreground/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {pendingFile && (
        <div className="mx-auto max-w-4xl px-3 pt-3 md:px-5">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/40 p-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={clearPendingFile}
              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
              aria-label="Bỏ tệp đã chọn"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex gap-3">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
                {pendingPreview && pendingFile.type.startsWith('image/') ? (
                  <img src={pendingPreview} alt={pendingFile.name} className="h-full w-full object-cover" />
                ) : pendingPreview && pendingFile.type.startsWith('video/') ? (
                  <video src={pendingPreview} className="h-full w-full object-cover" muted />
                ) : (
                  <PlusCircle className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 py-1">
                <p className="truncate text-sm font-bold text-foreground">{pendingFile.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{(pendingFile.size / 1024 / 1024).toFixed(2)} MB · xem trước trước khi gửi</p>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={clearPendingFile} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80">
                    Hủy
                  </button>
                  <button onClick={handleSendPendingFile} className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90">
                    Gửi tệp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {fileError && (
        <div className="mx-auto max-w-4xl px-3 pt-2 md:px-5">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span>{fileError}</span>
            <button
              onClick={() => setFileError(null)}
              className="rounded-full p-0.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Đóng lỗi tệp"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className={`mx-auto w-full max-w-4xl px-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2 ${compact ? '' : 'md:px-5 md:pb-4 md:pt-3'}`}>
        <div className="flex min-w-0 items-end gap-2 rounded-2xl border border-chat-border bg-chat-surface p-2 shadow-sm">
          {/* Left Actions */}
          <div className="flex shrink-0 items-center gap-0.5">
            <FileIconButton label="Đính kèm" onChange={handleFileChange}>
              <PlusCircle className="w-5 h-5" />
            </FileIconButton>
            <span className={`${compact ? 'hidden' : 'hidden lg:flex'} items-center gap-0.5`}>
              <FileIconButton label="Gửi ảnh" accept="image/*" onChange={handleFileChange}>
                <ImageIcon className="w-5 h-5" />
              </FileIconButton>
              <IconButton label="Sticker" onClick={() => onSendMessage('🙂', replyingTo?.id)}><Sticker className="w-5 h-5" /></IconButton>
              <FileIconButton label="GIF" accept="image/gif" onChange={handleFileChange}>
                <Clapperboard className="w-5 h-5" />
              </FileIconButton>
            </span>
          </div>

          {/* Input */}
          <div className="relative flex min-h-10 min-w-0 flex-1 items-end border-l border-border pl-3 pr-1 transition focus-within:border-[rgb(var(--chat-accent)/0.65)]">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Viết tin nhắn"
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              aria-describedby={inputText.length >= 3600 ? 'message-character-count' : undefined}
              className="min-w-0 flex-1 resize-none border-none bg-transparent py-[9px] text-[15px] leading-snug text-chat-text placeholder:text-chat-muted focus:outline-none max-h-[120px] [&::-webkit-scrollbar]:hidden"
              style={{ height: '22px' }}
            />
            <button 
              aria-label="Emoji"
              className="mb-1 ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              <Smile className="w-[18px] h-[18px]" />
            </button>
            {inputText.length >= 3600 && (
              <span id="message-character-count" className="absolute -top-5 right-2 text-[10px] font-semibold text-muted-foreground">
                {inputText.length}/{MAX_MESSAGE_LENGTH}
              </span>
            )}
          </div>

          {/* Right Action */}
          <div>
            {hasText ? (
              <button onClick={handleSend} aria-label="Gửi tin nhắn" className="flex h-10 w-10 items-center justify-center rounded-xl bg-chat-accent text-chat-accent-foreground shadow-sm transition hover:bg-chat-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-focus-ring)] focus-visible:ring-offset-2">
                <SendHorizontal className="h-4.5 w-4.5" />
              </button>
            ) : hasPendingFile ? (
              <IconButton onClick={handleSendPendingFile} label="Gửi tệp đã chọn">
                <SendHorizontal className="w-5 h-5" />
              </IconButton>
            ) : (
              <IconButton label="Gửi nhanh" onClick={() => onSendMessage(quickEmoji, replyingTo?.id)}>
                <ThumbsUp className="w-5 h-5" fill="currentColor" strokeWidth={0} />
              </IconButton>
            )}
          </div>
        </div>
        <div className="mt-1.5 hidden items-center justify-between px-1 text-[10px] font-medium text-muted-foreground/60 md:flex">
          <span>Enter để gửi · Shift + Enter để xuống dòng</span>
          <span>Nội dung được đồng bộ theo thời gian thực</span>
        </div>
      </div>
    </div>
  );
}
