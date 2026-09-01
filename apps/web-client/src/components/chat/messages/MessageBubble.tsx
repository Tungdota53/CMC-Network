'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Smile, MoreHorizontal, Reply, Check, CheckCheck, AlertCircle,
  Copy, Trash2, Undo2, Forward, Pin, X, Phone, Video, Timer, ExternalLink, Share2
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

const POST_URL_PATTERN = /((?:https?:\/\/[^\s]+)?\/posts\/[a-zA-Z0-9-]+)/;

function PostShareMessage({ content, isOwn }: { content: string; isOwn: boolean }) {
  const matchedUrl = content.match(POST_URL_PATTERN)?.[1];
  if (!matchedUrl) return null;
  const postUrl = matchedUrl.startsWith('http') ? matchedUrl : matchedUrl;

  const caption = content
    .replace(postUrl, '')
    .replace(/^\s*🔗\s*/u, '')
    .replace(/^Xem trên CMC Network:\s*/imu, '')
    .trim();

  return (
    <a
      href={postUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "block w-[min(330px,76vw)] overflow-hidden rounded-[18px] border text-left shadow-sm transition-transform hover:scale-[1.01]",
        isOwn
          ? "border-chat-border bg-chat-surface text-chat-text"
          : "border-chat-border bg-chat-surface text-chat-text"
      )}
    >
      <div className="flex items-center gap-2 border-b border-chat-border px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chat-accent text-chat-accent-foreground">
          <Share2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold leading-tight">CMC Network</div>
          <div className="text-[11px] text-chat-muted">Bài viết được chia sẻ</div>
        </div>
      </div>

      <div className="bg-chat-canvas">
        <div className="flex h-[145px] items-center justify-center bg-chat-accent px-5 text-center text-chat-accent-foreground">
          <div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <ExternalLink className="h-6 w-6" />
            </div>
            <div className="line-clamp-2 text-[18px] font-black leading-tight">
              {caption || 'Mở bài viết trên CMC Network'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-chat-muted">cmcnetwork.io.vn</div>
        <div className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug">{caption || 'Bài viết trên CMC Network'}</div>
        <div className="mt-1 line-clamp-2 text-[12px] leading-snug text-chat-muted">
          Nhấn để xem nội dung, bình luận và tương tác trên CMC Network.
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-chat-border px-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] text-chat-muted">{postUrl.replace(/^https?:\/\//, '')}</div>
        </div>
        <div className="shrink-0 rounded-lg bg-chat-hover px-3 py-1.5 text-xs font-bold text-chat-text">Xem bài viết</div>
      </div>
    </a>
  );
}

// ============================================================
// Types
// ============================================================
interface MessageBubbleProps {
  msg: any;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  conversationName: string;
  isGroup?: boolean;
  themeColor?: string;
  onReply?: (msg: any) => void;
  onUnsend?: (messageId: string) => void;
  onDeleteForMe?: (messageId: string) => void;
  onEdit?: (msg: any) => void;
  onReact?: (messageId: string, reactionType: string) => void;
  onRemoveReaction?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onCopy?: (text: string) => void;
  onRetry?: (msg: any) => void;
  allMessages?: any[];
  compact?: boolean;
}

// ============================================================
// MessageStatus
// ============================================================
function MessageStatus({ status }: { status?: string }) {
  if (!status) return null;
  switch (status) {
    case 'SENDING':
      return (
        <div className="mt-1 flex items-center justify-end gap-1 pr-1 text-[10px] font-medium text-muted-foreground" aria-label="Đang gửi">
          <div className="w-3 h-3 border-2 border-foreground/30 border-t-transparent rounded-full animate-spin" />
          <span>Đang gửi</span>
        </div>
      );
    case 'SENT':
      return (
        <div className="mt-1 flex min-h-4 items-center justify-end gap-1 pr-1 text-[10px] font-medium text-muted-foreground" aria-label="Đã gửi">
          <Check className="w-3.5 h-3.5" />
          <span>Đã gửi</span>
        </div>
      );
    case 'DELIVERED':
      return (
        <div className="mt-1 flex min-h-4 items-center justify-end gap-1 pr-1 text-[10px] font-medium text-muted-foreground" aria-label="Đã nhận">
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Đã nhận</span>
        </div>
      );
    case 'SEEN':
      return (
        <div className="mt-1 flex min-h-4 items-center justify-end gap-1 pr-1 text-[10px] font-semibold text-blue-400" aria-label="Đã xem">
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Đã xem</span>
        </div>
      );
    case 'FAILED':
      return (
        <div className="text-[11px] text-red-500 mt-0.5 flex items-center justify-end gap-1 pr-1">
          <AlertCircle className="w-3 h-3" />
          <span>Lỗi gửi</span>
        </div>
      );
    default:
      return null;
  }
}

// ============================================================
// Reaction Picker — 6 emoji reactions
// ============================================================
const REACTIONS = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'LOVE', emoji: '❤️' },
  { type: 'HAHA', emoji: '😆' },
  { type: 'WOW', emoji: '😮' },
  { type: 'SAD', emoji: '😢' },
  { type: 'ANGRY', emoji: '😡' },
];

function ReactionPicker({ 
  onReact, 
  onClose 
}: { 
  onReact: (type: string) => void; 
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const runAndClose = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div 
      ref={ref}
      className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full shadow-xl px-1.5 py-1 flex items-center gap-0.5 z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {REACTIONS.map(r => (
        <button
          key={r.type}
          onClick={() => { onReact(r.type); onClose(); }}
          className="w-8 h-8 rounded-full hover:bg-hover flex items-center justify-center text-[20px] transition-transform hover:scale-125"
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Reaction Badge — under bubble
// ============================================================
function ReactionBadge({ 
  reactions, 
  onRemoveReaction 
}: { 
  reactions: any[]; 
  onRemoveReaction?: () => void;
}) {
  if (!reactions || reactions.length === 0) return null;

  // Group by reaction type
  const grouped: Record<string, number> = {};
  reactions.forEach(r => {
    const type = r.type || r.reactionType;
    grouped[type] = (grouped[type] || 0) + 1;
  });

  const reactionEmoji: Record<string, string> = {
    LIKE: '👍', LOVE: '❤️', HAHA: '😆', WOW: '😮', SAD: '😢', ANGRY: '😡'
  };

  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {Object.entries(grouped).map(([type, count]) => (
        <button
          key={type}
          onClick={onRemoveReaction}
          className="flex items-center gap-0.5 bg-card border border-border rounded-full px-1.5 py-0.5 text-[12px] hover:bg-hover transition-colors shadow-sm"
        >
          <span>{reactionEmoji[type] || '👍'}</span>
          {count > 1 && <span className="text-foreground/60">{count}</span>}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Context Menu — right-click / [...] actions
// ============================================================
// ============================================================
// Context Menu — right-click / [...] actions
// ============================================================
function ContextMenu({
  onReply,
  onCopy,
  onRemove,
  onForward,
  onPin,
  onEdit,
  onClose,
  position,
  canEdit,
}: {
  onReply: () => void;
  onCopy: () => void;
  onRemove: () => void;
  onForward: () => void;
  onPin: () => void;
  onEdit: () => void;
  onClose: () => void;
  position: { x: number; y: number };
  canEdit: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const runAndClose = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={ref}
      className="fixed bg-card border border-border/50 rounded-xl shadow-xl py-1.5 z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-150 ease-out overflow-hidden"
      style={{ top: position.y, left: position.x }}
    >
      <MenuItem label="Trả lời" onClick={() => runAndClose(onReply)} />
      {canEdit && <MenuItem label="Chỉnh sửa" onClick={() => runAndClose(onEdit)} />}
      <MenuItem label="Ghim" onClick={() => runAndClose(onPin)} />
      <MenuItem label="Sao chép" onClick={() => runAndClose(onCopy)} />
      <MenuItem label="Chuyển tiếp" onClick={() => runAndClose(onForward)} />
      <MenuItem label="Gỡ" onClick={() => runAndClose(onRemove)} danger />
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-2 text-[14px] font-semibold w-full text-left transition-colors",
        danger
          ? "text-red-500 hover:bg-red-500/10"
          : "text-foreground hover:bg-hover"
      )}
    >
      <span>{label}</span>
    </button>
  );
}

// ============================================================
// Reply Preview inside bubble (quoted message)
// ============================================================
function ReplyQuote({ replyToId, allMessages }: { replyToId: string; allMessages?: any[] }) {
  const repliedMsg = allMessages?.find(m => m.id === replyToId);
  if (!repliedMsg) return null;

  return (
    <div className="mb-1 max-w-full rounded-r-md border-l-2 border-chat-accent bg-chat-hover px-2.5 py-1.5 text-[13px] leading-snug">
      <div className="text-primary/70 font-medium text-[11px] mb-0.5">
        {repliedMsg.isOwn ? 'Bạn' : repliedMsg.sender?.fullName || 'Người dùng'}
      </div>
      <div className="text-foreground/60 line-clamp-1">
        {repliedMsg.isUnsent ? 'Tin nhắn đã bị thu hồi' : (repliedMsg.content || repliedMsg.text || '')}
      </div>
    </div>
  );
}

// ============================================================
// MessageHoverActions — [smile] React, [reply], [more]
// ============================================================
function MessageHoverActions({ 
  isOwn, 
  isMenuOpen,
  onReactionClick,
  onReplyClick,
  onMoreClick,
}: { 
  isOwn: boolean;
  isMenuOpen: boolean;
  onReactionClick: () => void;
  onReplyClick: () => void;
  onMoreClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div className={cn(
      "absolute top-1/2 hidden -translate-y-1/2 items-center gap-0.5 transition-all duration-200 md:flex",
      isOwn ? "right-full mr-1.5" : "left-full ml-1.5",
      isMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
    )}>
      {!isOwn && (
        <>
          <button onClick={onReactionClick} className="w-7 h-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center cursor-pointer hover:bg-hover transition-colors">
            <Smile className="w-3.5 h-3.5 text-foreground/60" />
          </button>
          <button onClick={onReplyClick} className="w-7 h-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center cursor-pointer hover:bg-hover transition-colors">
            <Reply className="w-3.5 h-3.5 text-foreground/60" />
          </button>
        </>
      )}
      
      <button onClick={onMoreClick} className="w-7 h-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center cursor-pointer hover:bg-hover transition-colors">
        <MoreHorizontal className="w-3.5 h-3.5 text-foreground/60" />
      </button>

      {isOwn && (
        <>
          <button onClick={onReplyClick} className="w-7 h-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center cursor-pointer hover:bg-hover transition-colors">
            <Reply className="w-3.5 h-3.5 text-foreground/60" />
          </button>
          <button onClick={onReactionClick} className="w-7 h-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center cursor-pointer hover:bg-hover transition-colors">
            <Smile className="w-3.5 h-3.5 text-foreground/60" />
          </button>
        </>
      )}
    </div>
  );
}

// ============================================================
// MessageBubble — Main Component
// ============================================================
export function MessageBubble({ 
  msg, isFirstInGroup, isLastInGroup, conversationName, isGroup, themeColor,
  onReply, onUnsend, onDeleteForMe, onEdit, onReact, onRemoveReaction, onForward, onPin, onCopy, onRetry,
  allMessages, compact = false
}: MessageBubbleProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'everyone' | 'self'>('everyone');
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isMenuOpen = !!contextMenu || showReactionPicker;
  const senderName = (msg.sender?.fullName || msg.senderName || msg.sender?.name || conversationName || 'Người dùng').toString();
  const senderFallback = senderName.charAt(0).toUpperCase() || 'U';
  const senderAvatar = msg.sender?.avatarUrl || msg.senderAvatar || msg.sender?.avatar;
  const senderNameClass = 'text-chat-accent';

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Handle [...] click
  const handleMoreClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    // Position menu below the icon
    setContextMenu({ x: rect.left, y: rect.bottom + 4 });
  };

  const handleCopy = () => {
    const text = msg.content || msg.text || '';
    navigator.clipboard.writeText(text);
    onCopy?.(text);
  };

  const messageType = (msg.messageType || msg.type || 'text').toString().toLowerCase();
  const mediaUrl = msg.mediaUrl || msg.url;
  const isVisualMedia = (messageType === 'image' || messageType === 'video') && !!mediaUrl;
  const textContent = (msg.content || msg.text || '').toString();
  const isPostShare = messageType === 'text' && POST_URL_PATTERN.test(textContent);
  const canEdit = msg.isOwn && messageType === 'text' && !msg.isUnsent;
  const ownBubbleClass = 'border-chat-accent bg-chat-accent text-chat-accent-foreground';

  // UnsendMessage display
  if (msg.isUnsent) {
    return (
      <div className={cn("flex w-full mt-1", msg.isOwn ? "justify-end" : "justify-start", isFirstInGroup ? "mt-3" : "")}>
        {!msg.isOwn && (
          <div className="w-8 shrink-0 mr-2 flex items-end">
            {isLastInGroup && <Avatar src={senderAvatar || undefined} fallback={senderFallback} className="w-7 h-7" />}
          </div>
        )}
        <div className="px-3.5 py-2 rounded-2xl border border-border/50 bg-transparent">
          <span className="text-[14px] italic text-foreground/40">Tin nhắn đã bị thu hồi</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex w-full min-w-0 overflow-hidden px-0.5",
        msg.isOwn ? "justify-end" : "justify-start",
        isFirstInGroup ? "mt-4" : "mt-1"
      )}
      onContextMenu={handleContextMenu}
    >
      {/* Avatar */}
      {!msg.isOwn && (
        <div className="w-8 shrink-0 mr-2 flex items-end">
          {isLastInGroup && <Avatar src={senderAvatar || undefined} fallback={senderFallback} className="w-7 h-7" />}
        </div>
      )}
      
      <div className={cn(
        "flex min-w-0 flex-col",
        msg.isOwn ? "items-end" : "items-start",
        isVisualMedia ? "max-w-[min(84vw,32rem)]" : cn("max-w-[min(82vw,36rem)] md:max-w-[72%]", compact && "max-w-[86%] md:max-w-[86%]")
      )}>
        {!msg.isOwn && isGroup && isFirstInGroup && (
          <div className={cn("mb-1 ml-1 max-w-full truncate text-[12px] font-semibold", senderNameClass)}>
            {senderName}
          </div>
        )}
        {/* Bubble */}
        <div className="flex items-end relative" ref={bubbleRef}>
          <div 
            className={cn(
              "relative group max-w-full break-words text-[15px] leading-[1.45] [overflow-wrap:anywhere]",
              isVisualMedia || isPostShare
                ? "overflow-hidden bg-transparent p-0 shadow-none"
                : "border px-3.5 py-2.5 shadow-sm",
              !isVisualMedia && !isPostShare && (msg.isOwn ? ownBubbleClass : "border-chat-border bg-chat-raised text-chat-text"),
              isFirstInGroup && isLastInGroup ? "rounded-[18px]" :
              msg.isOwn
                ? cn("rounded-l-[18px]", isFirstInGroup ? "rounded-tr-[18px] rounded-br-[5px]" : isLastInGroup ? "rounded-br-[18px] rounded-tr-[5px]" : "rounded-r-[5px]")
                : cn("rounded-r-[18px]", isFirstInGroup ? "rounded-tl-[18px] rounded-bl-[5px]" : isLastInGroup ? "rounded-bl-[18px] rounded-tl-[5px]" : "rounded-l-[5px]")
            )}
          >
            {/* Reply Quote */}
            {msg.replyToId && (
              <ReplyQuote replyToId={msg.replyToId} allMessages={allMessages} />
            )}

            {/* Edited indicator */}
            {msg.isEdited && (
              <span className="text-[11px] opacity-60 mr-1">(đã chỉnh sửa)</span>
            )}

            {messageType === 'image' && mediaUrl ? (
              <img src={mediaUrl} alt={msg.content || 'Ảnh'} className="block h-auto max-h-[310px] w-full max-w-[280px] rounded-2xl object-cover" />
            ) : messageType === 'video' && mediaUrl ? (
              <video src={mediaUrl} controls className="block h-auto max-h-[310px] w-full max-w-[280px] rounded-2xl object-cover" />
            ) : messageType === 'audio' && mediaUrl ? (
              <audio src={mediaUrl} controls className="max-w-[260px]" />
            ) : messageType === 'file' && mediaUrl ? (
              <a href={mediaUrl} target="_blank" rel="noreferrer" className="underline font-semibold">
                {msg.content || 'Tải tệp'}
              </a>
            ) : messageType === 'call_audio' || messageType === 'call_video' ? (
              <div className="flex min-w-[210px] items-center gap-3 py-1">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', msg.isOwn ? 'bg-white/18 text-white' : messageType === 'call_video' ? 'bg-violet-500/10 text-violet-500' : 'bg-emerald-500/10 text-emerald-500')}>
                  {messageType === 'call_video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold">{messageType === 'call_video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}</div>
                  <div className={cn('mt-0.5 flex items-center gap-1 text-xs', msg.isOwn ? 'text-white/75' : 'text-muted-foreground')}>
                    <Timer className="h-3 w-3" />
                    Đã kết thúc
                  </div>
                </div>
              </div>
            ) : isPostShare ? (
              <PostShareMessage content={textContent} isOwn={msg.isOwn} />
            ) : (
              msg.content || msg.text
            )}

            {msg.status === 'SENDING' && typeof msg.uploadProgress === 'number' && (
              <div className="absolute inset-x-2 bottom-2 overflow-hidden rounded-full bg-black/35" role="progressbar" aria-label={`Đang tải ${msg.content || 'tệp'}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={msg.uploadProgress}>
                <div className="h-1 rounded-full bg-white transition-[width]" style={{ width: `${msg.uploadProgress}%` }} />
              </div>
            )}
            
            {/* Hover Actions */}
            <MessageHoverActions 
              isOwn={msg.isOwn} 
              isMenuOpen={isMenuOpen}
              onReactionClick={() => setShowReactionPicker(!showReactionPicker)}
              onReplyClick={() => onReply?.(msg)}
              onMoreClick={handleMoreClick}
            />
          </div>

          {/* Reaction Picker Popup */}
          {showReactionPicker && (
            <ReactionPicker
              onReact={(type) => onReact?.(msg.id, type)}
              onClose={() => setShowReactionPicker(false)}
            />
          )}
        </div>
        
        {/* Reaction Badges */}
        {msg.reactions && msg.reactions.length > 0 && (
          <ReactionBadge 
            reactions={msg.reactions} 
            onRemoveReaction={() => onRemoveReaction?.(msg.id)}
          />
        )}

        {isLastInGroup && (
          <button
            type="button"
            onClick={handleMoreClick}
            className="mt-1 flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-muted-foreground transition hover:bg-hover hover:text-foreground md:hidden"
            aria-label="Mở hành động tin nhắn"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
            Tùy chọn
          </button>
        )}

        {/* Status */}
        {msg.isOwn && isLastInGroup && (
          msg.status === 'FAILED' ? (
            <button
              type="button"
              onClick={() => onRetry?.(msg)}
              className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:underline"
            >
              <AlertCircle className="h-3 w-3" /> Gửi lại
            </button>
          ) : <MessageStatus status={msg.status} />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          onReply={() => onReply?.(msg)}
          onCopy={handleCopy}
          onRemove={() => setShowDeleteConfirm(true)}
          onForward={() => onForward?.(msg.id)}
          onPin={() => onPin?.(msg.id)}
          onEdit={() => onEdit?.(msg)}
          canEdit={canEdit}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Delete Confirmation Modal (Messenger exact style) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 animate-in bg-foreground/40 fade-in duration-200" onClick={() => setShowDeleteConfirm(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby={`delete-message-${msg.id}`} className="relative flex w-[340px] flex-col overflow-hidden rounded-xl border border-chat-border bg-chat-surface shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-chat-border p-4">
              <h3 id={`delete-message-${msg.id}`} className="mx-auto pl-8 text-[17px] font-bold text-foreground">
                {msg.isOwn ? 'Gỡ tin nhắn' : 'Gỡ đối với bạn'}
              </h3>
              <button aria-label="Đóng hộp thoại gỡ tin nhắn" onClick={() => setShowDeleteConfirm(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-hover">
                <X className="w-5 h-5 text-foreground/60" />
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              {msg.isOwn ? (
                // Sender's message: show 2 options
                <>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                      <input 
                        type="radio" 
                        name="delete_type" 
                        className="peer sr-only"
                        checked={deleteOption === 'everyone'}
                        onChange={() => setDeleteOption('everyone')}
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-foreground/30 peer-checked:border-primary peer-checked:border-[6px] transition-all"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[15px] text-foreground leading-tight">Thu hồi tin nhắn</span>
                      <span className="text-[13px] text-foreground/60 mt-1">Sẽ gỡ tin nhắn khỏi đoạn chat đối với mọi người.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                      <input 
                        type="radio" 
                        name="delete_type" 
                        className="peer sr-only"
                        checked={deleteOption === 'self'}
                        onChange={() => setDeleteOption('self')}
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-foreground/30 peer-checked:border-primary peer-checked:border-[6px] transition-all"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[15px] text-foreground leading-tight">Gỡ đối với bạn</span>
                      <span className="text-[13px] text-foreground/60 mt-1">Hệ thống sẽ gỡ tin nhắn này cho bạn. Các thành viên khác trong đoạn chat vẫn có thể xem được.</span>
                    </div>
                  </label>
                </>
              ) : (
                // Other's message: show only the self-remove text
                <div className="flex flex-col">
                  <span className="text-[14px] text-foreground/80">
                    Hệ thống sẽ gỡ tin nhắn này cho bạn. Các thành viên khác trong đoạn chat vẫn có thể xem được.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 pt-2">
              <button 
                className="rounded-lg px-4 py-2 text-[15px] font-semibold text-primary transition-colors hover:bg-hover"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Hủy
              </button>
              <button 
                className="rounded-lg bg-chat-accent px-4 py-2 text-[15px] font-semibold text-chat-accent-foreground transition-colors hover:bg-chat-accent-hover"
                onClick={() => { 
                  if (msg.isOwn && deleteOption === 'everyone') {
                    onUnsend?.(msg.id);
                  } else {
                    onDeleteForMe?.(msg.id);
                  }
                  setShowDeleteConfirm(false); 
                }}
              >
                Gỡ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
