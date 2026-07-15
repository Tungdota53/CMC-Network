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
    <div className="flex items-center justify-center py-3">
      <span className="text-[12px] font-medium text-slate-400/80">
        {label}
      </span>
    </div>
  );
}

/**
 * SystemMessage — Plan 02J: italic, centered, gray
 */
function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex items-center justify-center py-2 px-4">
      <span className="text-center text-[13px] italic text-slate-400/85">{content}</span>
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
  messages, conversationName, isGroup, conversationAvatarUrl, themeClassName, themeColor, loading, onLoadOlder,
  onReply, onUnsend, onDeleteForMe, onEdit, onReact, onRemoveReaction, onForward, onPin, onCopy
}: MessageAreaProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const displayName = (conversationName || 'Cuộc trò chuyện').trim() || 'Cuộc trò chuyện';
  const avatarFallback = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn('flex-1 flex flex-col items-center justify-center py-10', themeClassName)}>
        <Avatar src={conversationAvatarUrl || undefined} fallback={avatarFallback} className="w-20 h-20 mb-4" />
        <h3 className="text-[18px] font-bold text-foreground">{displayName}</h3>
        <p className="text-[14px] text-foreground/50 mt-1">Các bạn là bạn bè trên CMC Campus</p>
        <p className="text-[13px] text-foreground/40 mt-6">
          Chưa có tin nhắn nào. Hãy là người bắt đầu cuộc trò chuyện!
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative flex min-w-0 flex-1 flex-col overflow-hidden', themeClassName)}>
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
            <div className="flex min-w-0 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <Avatar src={conversationAvatarUrl || undefined} fallback={avatarFallback} className="w-20 h-20" />
              <h3 className="mt-2 max-w-full truncate text-[18px] font-bold text-foreground">{displayName}</h3>
              <p className="text-[13px] text-foreground/50">Các bạn là bạn bè trên CMC Campus</p>
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
            <div className="min-w-0 overflow-hidden px-2 md:px-3">
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
                onReply={onReply}
                onUnsend={onUnsend}
                onDeleteForMe={onDeleteForMe}
                onEdit={onEdit}
                onReact={onReact}
                onRemoveReaction={onRemoveReaction}
                onForward={onForward}
                onPin={onPin}
                onCopy={onCopy}
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
          className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground/70 hover:bg-hover transition-colors z-10"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
