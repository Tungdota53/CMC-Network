import React from 'react';
import { Heart, MessageCircle, UserPlus, Share2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';
import { getNotificationActionUrl } from './notification-links';

interface Props {
  id: string;
  title: string;
  content?: string;
  type: string;
  isRead: boolean;
  timeAgo: string;
  avatarUrl?: string;
  senderName?: string;
  actionUrl?: string;
  onRead?: (id: string) => void;
}

export const NotificationItem = ({ id, title, content, type, isRead, timeAgo, avatarUrl, senderName, actionUrl, onRead }: Props) => {
  const getIcon = () => {
    switch (type) {
      case 'LIKE': return <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-background"><Heart className="w-3 h-3 fill-current" /></div>;
      case 'COMMENT': return <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center border-2 border-background"><MessageCircle className="w-3 h-3" /></div>;
      case 'FRIEND_REQUEST': return <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center border-2 border-background"><UserPlus className="w-3 h-3" /></div>;
      case 'SHARE': return <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center border-2 border-background"><Share2 className="w-3 h-3" /></div>;
      default: return null;
    }
  };

  const resolvedActionUrl = actionUrl || getNotificationActionUrl(type);
  const Wrapper = resolvedActionUrl ? Link : 'div';

  return (
    <Wrapper 
      href={resolvedActionUrl || '#'}
      onClick={() => onRead?.(id)}
      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-hover transition-colors cursor-pointer relative group ${!isRead ? 'bg-primary/5' : ''}`}
    >
      <div className="relative shrink-0">
        <Avatar size="lg" src={avatarUrl} fallback={senderName?.trim().charAt(0).toUpperCase()} />
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-[14px] text-foreground line-clamp-2">{title}</p>
        {content && (
          <p className="text-[13px] text-foreground/50 truncate mt-0.5">{content}</p>
        )}
        <span className={`text-[12px] font-medium mt-1 block ${!isRead ? 'text-primary' : 'text-foreground/40'}`}>
          {timeAgo}
        </span>
      </div>

      {!isRead && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary" />
      )}
    </Wrapper>
  );
};
