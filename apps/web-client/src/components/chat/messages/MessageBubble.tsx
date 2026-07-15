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
          ? "border-white/20 bg-white text-slate-950"
          : "border-border bg-white text-slate-950 dark:bg-slate-950 dark:text-white"
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877f2] text-white">
          <Share2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold leading-tight">CMC Network</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Bài viết được chia sẻ</div>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-900">
        <div className="flex h-[145px] items-center justify-center bg-gradient-to-br from-[#1877f2] via-[#2d88ff] to-[#8bd3ff] px-5 text-center text-white">
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
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">cmcnetwork.io.vn</div>
        <div className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug">{caption || 'Bài viết trên CMC Network'}</div>
        <div className="mt-1 line-clamp-2 text-[12px] leading-snug text-slate-500 dark:text-slate-400">
          Nhấn để xem nội dung, bình luận và tương tác trên CMC Network.
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2 dark:border-white/10">
        <div className="min-w-0">
          <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{postUrl.replace(/^https?:\/\//, '')}</div>
        </div>
        <div className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-white">Xem bài viết</div>
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
  allMessages?: any[];
}

// ============================================================
// MessageStatus
// ============================================================
function MessageStatus({ status }: { status?: string }) {
  if (!status) return null;
  switch (status) {
    case 'SENDING':
      return (
        <div className="text-[11px] text-foreground/40 mt-0.5 flex items-center justify-end gap-1 pr-1">
          <div className="w-3 h-3 border-2 border-foreground/30 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    case 'SENT':
      return (
        <div className="text-[11px] text-foreground/50 mt-0.5 flex items-center justify-end pr-1">
          <Check className="w-3.5 h-3.5" />
        </div>
      );
    case 'DELIVERED':
      return (
        <div className="text-[11px] text-foreground/50 mt-0.5 flex items-center justify-end pr-1">
          <CheckCheck className="w-3.5 h-3.5" />
        </div>
      );
    case 'SEEN':
      return (
        <div className="text-[11px] text-primary mt-0.5 flex items-center justify-end pr-1">
          <CheckCheck className="w-3.5 h-3.5" />
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
          : "text-foreground hover:bg-black/5 dark:hover:bg-white/10"
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
    <div className="mb-1 px-2.5 py-1.5 border-l-2 border-primary/50 bg-black/10 rounded-r-md text-[13px] leading-snug max-w-full">
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
  onReply, onUnsend, onDeleteForMe, onEdit, onReact, onRemoveReaction, onForward, onPin, onCopy,
  allMessages
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
  const senderNameClass = {
    blue: 'text-sky-300',
    purple: 'text-violet-300',
    green: 'text-emerald-300',
    orange: 'text-orange-300',
  }[themeColor || 'blue'] || 'text-sky-300';

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
  const ownBubbleClass = {
    blue: 'bg-[#0084ff] text-white',
    purple: 'bg-violet-600 text-white',
    green: 'bg-emerald-600 text-white',
    orange: 'bg-orange-600 text-white',
  }[themeColor || 'blue'] || 'bg-[#0084ff] text-white';

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
        "flex w-full min-w-0 overflow-hidden",
        msg.isOwn ? "justify-end" : "justify-start",
        isFirstInGroup ? "mt-3" : "mt-0.5"
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
        isVisualMedia ? "max-w-[min(82vw,32rem)]" : "max-w-[min(76vw,32rem)] md:max-w-[70%]"
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
              "relative group max-w-full break-words text-[15px] leading-snug [overflow-wrap:anywhere]",
              isVisualMedia || isPostShare
                ? "overflow-hidden bg-transparent p-0 shadow-none"
                : "px-3.5 py-2 shadow-sm",
              !isVisualMedia && !isPostShare && (msg.isOwn ? ownBubbleClass : "bg-white/10 dark:bg-white/5 border border-white/5 backdrop-blur-md text-foreground"),
              isFirstInGroup && isLastInGroup ? "rounded-2xl" :
              msg.isOwn
                ? cn("rounded-l-2xl", isFirstInGroup ? "rounded-tr-2xl rounded-br-md" : isLastInGroup ? "rounded-br-2xl rounded-tr-md" : "rounded-r-md")
                : cn("rounded-r-2xl", isFirstInGroup ? "rounded-tl-2xl rounded-bl-md" : isLastInGroup ? "rounded-bl-2xl rounded-tl-md" : "rounded-l-md")
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

        {/* Status */}
        {msg.isOwn && isLastInGroup && <MessageStatus status={msg.status} />}
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-[340px] bg-card rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden border border-white/5">
            <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
              <h3 className="font-bold text-[17px] text-foreground mx-auto pl-8">
                {msg.isOwn ? 'Gỡ tin nhắn' : 'Gỡ đối với bạn'}
              </h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0">
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
                className="px-4 py-2 rounded-lg font-semibold text-[15px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-primary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 rounded-lg font-semibold text-[15px] bg-[#0084ff] hover:bg-[#0073e6] text-white transition-colors"
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
