import React from 'react';
import { Minus, X, Maximize2, Phone, Video, MoreHorizontal } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const displayName = (name || 'Cuộc trò chuyện').trim() || 'Cuộc trò chuyện';
  const avatarFallback = displayName.charAt(0).toUpperCase();

  React.useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !menuButtonRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div 
      className="relative flex h-14 shrink-0 cursor-pointer items-center justify-between border-b border-chat-border bg-chat-surface px-2.5 transition-colors hover:bg-chat-hover"
      onClick={onMinimize} // Minimize when clicking on header body
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 pointer-events-none mr-2">
        <div className="relative shrink-0">
          <Avatar src={avatarUrl} fallback={avatarFallback} size="sm" className="border border-chat-border shadow-sm" />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background/80 rounded-full translate-x-[10%] translate-y-[10%] shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1 drop-shadow-sm">
          <div className="flex min-w-0 items-center gap-1.5"><h4 className="truncate text-[14px] font-bold leading-tight tracking-tight text-foreground">{displayName}</h4><span className="shrink-0 rounded bg-blue-500/15 px-1 py-0.5 text-[8px] font-black uppercase tracking-wider text-blue-400">Masega</span></div>
          <span className="text-[11px] text-foreground/60 leading-tight font-medium mt-0.5 truncate">
            {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-0.5 text-chat-muted">
        <button aria-label="Gọi thoại" onClick={(e) => { e.stopPropagation(); onCall?.(); }} className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-chat-hover hover:text-chat-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-focus">
          <Phone className="w-[18px] h-[18px]" fill="currentColor" />
        </button>
        <button ref={menuButtonRef} aria-label="Tác vụ khác" aria-haspopup="menu" aria-controls="mini-chat-actions" aria-expanded={menuOpen} onClick={(e) => { e.stopPropagation(); setMenuOpen((value) => !value); }} className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-chat-hover hover:text-chat-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-focus"><MoreHorizontal className="h-5 w-5" /></button>
        <button aria-label="Thu nhỏ" onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-chat-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-focus">
          <Minus className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
        <button aria-label="Đóng chat" onClick={(e) => { e.stopPropagation(); onClose(); }} className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-red-500/20 hover:text-red-400">
          <X className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
      </div>
      {menuOpen && <div ref={menuRef} id="mini-chat-actions" role="menu" className="absolute right-2 top-12 z-20 w-44 rounded-xl border border-chat-border bg-chat-raised p-1 text-chat-text shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button role="menuitem" onClick={() => { onVideoCall?.(); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-chat-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-focus"><Video className="h-4 w-4" />Gọi video</button>
        {onPopOut && <button role="menuitem" onClick={() => { onPopOut(); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-chat-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-focus"><Maximize2 className="h-4 w-4" />Mở toàn màn hình</button>}
      </div>}
    </div>
  );
};
