'use client';

import { useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { ChevronDown } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface MessageAreaProps {
  messages: any[];
  conversationName: string;
  isGroup?: boolean;
  conversationAvatarUrl?: string | null;
  themeClassName?: string;
  themeColor?: string;
  loading?: boolean;
  compact?: boolean;
  onLoadOlder?: () => void;
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
}

/**
 * TimeDivider — Plan 02J: "10:30" nhỏ, group by time
 */
function TimeDivider({ timestamp }: { timestamp: string }) {
  const d = new Date(timestamp);
  const now = new Date();
  
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  
  let label = '';
  if (isToday) {
    label = timeStr;
  } else if (isYesterday) {
    label = `Hôm qua ${timeStr}`;
  } else {
    label = `${d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })}, ${timeStr}`;
  }

  return (
    <div className="flex items-center gap-3 px-2 py-5" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
      <span className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
        {label}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}

/**
 * SystemMessage — Plan 02J: italic, centered, gray
 */
function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex items-center justify-center py-2 px-4">
      <span className="rounded-full bg-hover px-3 py-1.5 text-center text-xs text-muted-foreground">{content}</span>
    </div>
  );
}

/**
 * MessageArea — Plan 02J
 * - react-virtuoso reverse scroll, alignToBottom
 * - DateDivider between different days
 * - SystemMessage for system-type messages
 * - ScrollToBottom button
 * - Profile info header at top of chat
 */
export function MessageArea({ 
  messages, conversationName, isGroup, conversationAvatarUrl, themeClassName, themeColor, loading, compact = false, onLoadOlder,
  onReply, onUnsend, onDeleteForMe, onEdit, onReact, onRemoveReaction, onForward, onPin, onCopy, onRetry
}: MessageAreaProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const displayName = (conversationName || 'Cuộc trò chuyện').trim() || 'Cuộc trò chuyện';
  const avatarFallback = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className={cn('flex flex-1 flex-col justify-end gap-3 overflow-hidden bg-chat-canvas px-4 pb-6', compact && 'px-3 pb-3', themeClassName)} aria-label="Đang tải tin nhắn" aria-busy="true">
        <div className="h-12 w-2/5 animate-pulse self-start rounded-2xl rounded-bl-md bg-hover" />
        <div className="h-16 w-3/5 animate-pulse self-end rounded-2xl rounded-br-md bg-primary/15" />
        <div className="h-10 w-1/3 animate-pulse self-start rounded-2xl rounded-bl-md bg-hover" />
        <div className="h-24 w-1/2 animate-pulse self-end rounded-2xl rounded-br-md bg-primary/15" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center bg-chat-canvas px-6 py-10 text-center', compact && 'px-4 py-6', themeClassName)}>
        <div className="rounded-full border border-border bg-card p-1 shadow-sm">
          <Avatar src={conversationAvatarUrl || undefined} fallback={avatarFallback} className="h-20 w-20" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">{displayName}</h3>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">Bắt đầu bằng lời chào, chia sẻ tài liệu hoặc gửi ảnh cho cuộc trò chuyện này.</p>
      </div>
    );
  }

  return (
    <div className={cn('relative flex min-w-0 flex-1 flex-col overflow-hidden bg-chat-canvas text-chat-text', themeClassName)}>
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        initialTopMostItemIndex={messages.length - 1}
        followOutput="smooth"
        overscan={200}
        alignToBottom
        className="w-full min-w-0 flex-1 overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20"
        
        // Plan 02J: Scroll lên → load older
        startReached={() => {
          if (onLoadOlder) onLoadOlder();
        }}
        
        // Track scroll position for ScrollToBottom button
        atBottomStateChange={(atBottom) => {
          setShowScrollButton(!atBottom);
        }}
        
        components={{
          // Profile info at top of messages
          Header: () => (
            <div className={cn('flex min-w-0 flex-col items-center justify-center gap-2 px-4 pb-10 pt-16 text-center', compact && 'pb-6 pt-8')}>
              <div className="relative"><div className="absolute -inset-4 rounded-full bg-[rgb(var(--chat-accent)/0.10)] blur-xl" /><Avatar src={conversationAvatarUrl || undefined} fallback={avatarFallback} className="relative h-20 w-20 ring-4 ring-card" /></div>
              <h3 className="mt-4 max-w-full truncate text-lg font-bold tracking-tight text-foreground">{displayName}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Đầu cuộc trò chuyện</p>
            </div>
          ),
          // Bottom padding
          Footer: () => <div className="h-3" />
        }}
        
        itemContent={(index, msg) => {
          // System messages — Plan 02J
          if ((msg.messageType || msg.type || '').toString().toLowerCase() === 'system') {
            return <SystemMessage content={msg.content} />;
          }

          const prevMsg = index > 0 ? messages[index - 1] : null;
          const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
          
          const msgTime = new Date(msg.createdAt || msg.timestamp).getTime();
          const prevTime = prevMsg ? new Date(prevMsg.createdAt || prevMsg.timestamp).getTime() : 0;
          const nextTime = nextMsg ? new Date(nextMsg.createdAt || nextMsg.timestamp).getTime() : 0;
          
          const timeDiffPrev = prevMsg ? msgTime - prevTime : 0;
          const timeDiffNext = nextMsg ? nextTime - msgTime : 0;

          // Grouping logic — Plan 02J: > 3min (180000ms) breaks the message bubble group
          const isDifferentSenderPrev = !prevMsg || prevMsg.senderId !== msg.senderId || (prevMsg.messageType || prevMsg.type || '').toString().toLowerCase() === 'system';
          const isDifferentSenderNext = !nextMsg || nextMsg.senderId !== msg.senderId || (nextMsg.messageType || nextMsg.type || '').toString().toLowerCase() === 'system';
          
          const isFirstInGroup = isDifferentSenderPrev || timeDiffPrev > 180000;
          const isLastInGroup = isDifferentSenderNext || timeDiffNext > 180000;
          
          // Show Time Divider if > 10 minutes (600000ms) gap
          const showTimeDivider = !prevMsg || timeDiffPrev > 600000;

          return (
            <div className={cn('relative z-[1] mx-auto min-w-0 max-w-4xl overflow-hidden px-2 md:px-5', compact && 'px-2 md:px-2')}>
              {/* TimeDivider — Group by 10 minutes */}
              {showTimeDivider && (
                <TimeDivider timestamp={msg.createdAt || msg.timestamp} />
              )}
              <MessageBubble 
                msg={msg} 
                isFirstInGroup={isFirstInGroup} 
                isLastInGroup={isLastInGroup}
                conversationName={conversationName}
                isGroup={isGroup}
                themeColor={themeColor}
                compact={compact}
                onReply={onReply}
                onUnsend={onUnsend}
                onDeleteForMe={onDeleteForMe}
                onEdit={onEdit}
                onReact={onReact}
                onRemoveReaction={onRemoveReaction}
                onForward={onForward}
                onPin={onPin}
                onCopy={onCopy}
                onRetry={onRetry}
                allMessages={messages}
              />
            </div>
          );
        }}
      />

      {/* ScrollToBottom — Plan 02J */}
      {showScrollButton && (
        <button
          onClick={() => virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' })}
          aria-label="Cuộn tới tin nhắn mới nhất"
          className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-xl shadow-black/15 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
