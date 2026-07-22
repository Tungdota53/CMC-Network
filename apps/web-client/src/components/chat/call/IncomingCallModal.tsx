'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, ShieldCheck, Video } from 'lucide-react';
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
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    acceptButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !responding) onReject();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onReject, responding]);

  const respond = (action: () => void) => {
    if (responding) return;
    setResponding(true);
    action();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-[#080b12]/90 p-4 text-white backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="incoming-call-title" aria-describedby="incoming-call-description">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(59,130,246,0.22),transparent_36%)]" />
      <div className="relative flex w-full max-w-[390px] flex-col items-center rounded-3xl border border-white/10 bg-white/[0.06] px-7 py-8 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/60">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Cuộc gọi đến
        </div>
        <div className="relative mb-5">
          <div className="absolute -inset-3 rounded-full border border-blue-400/20" />
          <div className="absolute -inset-6 rounded-full border border-blue-400/10" />
        <Avatar
          size="xl"
          src={callerAvatar || undefined}
          fallback={avatarFallback}
          className="relative h-28 w-28 border-4 border-white/10 shadow-2xl"
        />
        </div>
        <h2 id="incoming-call-title" className="text-2xl font-semibold tracking-tight">{displayName}</h2>
        <p id="incoming-call-description" className="mt-2 flex items-center gap-1.5 text-sm text-white/60">
          {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          {isVideo ? 'Cuộc gọi video đến…' : 'Cuộc gọi thoại đến…'}
        </p>
        <div className="mb-8 mt-3 flex items-center gap-1.5 text-xs text-white/40"><ShieldCheck className="h-3.5 w-3.5" /> Kết nối được mã hóa</div>

        <div className="grid w-full grid-cols-2 gap-4">
          <button
            onClick={() => respond(onReject)} disabled={responding} aria-label="Từ chối cuộc gọi"
            className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl bg-red-500/15 text-red-300 transition hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
          >
            <PhoneOff className="h-6 w-6" /><span className="text-xs font-semibold">Từ chối</span>
          </button>
          <button
            ref={acceptButtonRef} onClick={() => respond(onAccept)} disabled={responding} aria-label={isVideo ? 'Nhận cuộc gọi video' : 'Nhận cuộc gọi thoại'}
            className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          >
            {isVideo ? (
              <Video className="h-6 w-6" />
            ) : (
              <Phone className="h-6 w-6" />
            )}
            <span className="text-xs font-semibold">Trả lời</span>
          </button>
        </div>
      </div>
    </div>
  );
};
