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
      className="w-8 h-8 rounded-full text-primary hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0"
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
      className="w-8 h-8 rounded-full text-primary hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
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
export function MessageInput({ onSendMessage, onSendMedia, replyingTo, onCancelReply, transparent, quickEmoji = '👍' }: MessageInputProps) {
  const [inputText, setInputText] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus input when reply starts
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), replyingTo?.id);
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
    setInputText(e.target.value);
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
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    setPendingPreview(file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : null);
  };

  const clearPendingFile = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  };

  const handleSendPendingFile = () => {
    if (!pendingFile || !onSendMedia) return;
    onSendMedia(pendingFile, replyingTo?.id);
    clearPendingFile();
    onCancelReply?.();
  };

  return (
    <div className={`${transparent ? 'bg-transparent' : 'bg-card border-t border-border/30'} w-full min-w-0 shrink-0 overflow-hidden`}>
      {/* Reply Preview — Plan 02J */}
      {replyingTo && (
        <div className="px-4 pt-2 pb-1 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex-1 bg-hover rounded-lg px-3 py-2 border-l-2 border-primary">
            <div className="text-[11px] font-semibold text-primary mb-0.5">
              Đang trả lời {replyingTo.isOwn ? 'chính mình' : (replyingTo.sender?.fullName || 'tin nhắn')}
            </div>
            <div className="text-[13px] text-foreground/60 line-clamp-1">
              {replyingTo.content || replyingTo.text || ''}
            </div>
          </div>
          <button 
            onClick={onCancelReply}
            className="w-7 h-7 rounded-full hover:bg-hover flex items-center justify-center text-foreground/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {pendingFile && (
        <div className="px-4 pt-3">
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

      {/* Input Bar */}
      <div className="px-2 py-2 md:px-3">
        <div className="flex min-w-0 items-end gap-1 md:gap-1.5">
          {/* Left Actions */}
          <div className="flex shrink-0 items-center gap-0.5 pb-0.5">
            <FileIconButton label="Đính kèm" onChange={handleFileChange}>
              <PlusCircle className="w-5 h-5" />
            </FileIconButton>
            <span className="hidden items-center gap-0.5 sm:flex">
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
          <div className="flex min-w-0 flex-1 items-end rounded-2xl border border-white/5 bg-white/10 px-3 py-1.5 shadow-inner backdrop-blur-md dark:bg-black/10">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Aa"
              rows={1}
              className="min-w-0 flex-1 resize-none border-none bg-transparent py-[5px] text-[15px] leading-snug text-foreground placeholder:text-foreground/40 focus:outline-none max-h-[120px] [&::-webkit-scrollbar]:hidden"
              style={{ height: '22px' }}
            />
            <button 
              aria-label="Emoji"
              className="w-6 h-6 rounded-full text-primary hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0 ml-1 mb-px"
            >
              <Smile className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* Right Action */}
          <div className="pb-0.5">
            {hasText ? (
              <IconButton onClick={handleSend} label="Gửi tin nhắn">
                <SendHorizontal className="w-5 h-5" />
              </IconButton>
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
      </div>
    </div>
  );
}
