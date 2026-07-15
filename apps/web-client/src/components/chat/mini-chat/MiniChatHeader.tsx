import React from 'react';
import { Minus, X, Maximize2, Phone, Video } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface Props {
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onPopOut?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
}

export const MiniChatHeader = ({ name, avatarUrl, isOnline, onClose, onMinimize, onPopOut, onCall, onVideoCall }: Props) => {
  const displayName = (name || 'Cuộc trò chuyện').trim() || 'Cuộc trò chuyện';
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <div 
      className="h-16 border-b border-black/5 dark:border-white/10 flex items-center justify-between px-3 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
      onClick={onMinimize} // Minimize when clicking on header body
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 pointer-events-none mr-2">
        <div className="relative shrink-0">
          <Avatar src={avatarUrl} fallback={avatarFallback} size="sm" className="shadow-sm" />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background/80 rounded-full translate-x-[10%] translate-y-[10%] shadow-sm"></div>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h4 className="font-semibold text-[15px] text-foreground leading-tight truncate tracking-tight">{displayName}</h4>
          <span className="text-[11px] text-foreground/60 leading-tight font-medium mt-0.5 truncate">
            {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-foreground/80">
        <button onClick={(e) => { e.stopPropagation(); onCall?.(); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <Phone className="w-[18px] h-[18px]" fill="currentColor" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onVideoCall?.(); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <Video className="w-5 h-5" fill="currentColor" />
        </button>
        {onPopOut && (
          <button onClick={(e) => { e.stopPropagation(); onPopOut(); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Maximize2 className="w-[17px] h-[17px]" strokeWidth={2.5} />
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <Minus className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors">
          <X className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
