import React from 'react';
import { Phone, PhoneMissed, Timer, Video } from 'lucide-react';

interface Props {
  isVideo: boolean;
  duration?: string; // "5:32", or undefined if missed
  isMissed?: boolean;
}

export const CallMessageBubble = ({ isVideo, duration, isMissed }: Props) => {
  return (
    <div className="group flex w-72 cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/40 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${isMissed ? 'bg-red-500/10 text-red-500' : isVideo ? 'bg-violet-500/10 text-violet-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
        {isMissed ? <PhoneMissed className="h-5 w-5" /> : isVideo ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className={`truncate text-[15px] font-bold ${isMissed ? 'text-red-500' : 'text-foreground'}`}>
          {isMissed ? 'Cuộc gọi bị nhỡ' : isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
        </h4>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          {isMissed ? 'Không trả lời' : duration || 'Đã kết thúc'}
        </p>
      </div>
    </div>
  );
};
