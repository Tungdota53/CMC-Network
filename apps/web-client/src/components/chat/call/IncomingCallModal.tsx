'use client';

import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface Props {
  callerName: string;
  callerAvatar?: string;
  isVideo: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal = ({
  callerName,
  callerAvatar,
  isVideo,
  onAccept,
  onReject,
}: Props) => {
  const displayName = (callerName || 'Người dùng').trim() || 'Người dùng';
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="flex w-full max-w-[360px] flex-col items-center rounded-[2rem] border border-white/10 bg-card p-8 shadow-2xl animate-in zoom-in-95">
        <Avatar
          size="xl"
          src={callerAvatar || undefined}
          fallback={avatarFallback}
          className="w-24 h-24 mb-4"
        />
        <h2 className="text-xl font-bold text-foreground mb-1">{displayName}</h2>
        <p className="mb-2 flex items-center gap-1.5 text-foreground/60">
          {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          {isVideo ? 'Cuộc gọi video đến…' : 'Cuộc gọi thoại đến…'}
        </p>
        <p className="mb-8 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Vuốt/bấm nhận để bắt máy</p>

        <div className="flex items-center gap-8">
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors"
            title="Từ chối"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-colors animate-pulse"
            title="Trả lời"
          >
            {isVideo ? (
              <Video className="w-7 h-7 text-white" />
            ) : (
              <Phone className="w-7 h-7 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
