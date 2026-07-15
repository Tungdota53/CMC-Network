'use client';

import React, { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Props {
  conversationId: string;
  title: string;
  onClose: () => void;
}

export const LiveKitGroupCall = ({ conversationId, title, onClose }: Props) => {
  const { user } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadToken = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.post('/chat/calls/livekit/token', {
          conversationId,
          displayName: (user as any)?.fullName || user?.email || 'Người dùng',
        });
        const data = res.data?.data ?? res.data;
        if (cancelled) return;
        setToken(data.token);
        setUrl(data.url);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Không tạo được phòng gọi nhóm LiveKit.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadToken();
    return () => {
      cancelled = true;
    };
  }, [conversationId, user]);

  return (
    <div className="fixed inset-0 z-[130] bg-gray-950 text-white">
      <div className="absolute left-6 top-5 z-10 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-white/60">LiveKit SFU · Group video call</div>
      </div>

      <button
        onClick={onClose}
        aria-label="Đóng cuộc gọi nhóm"
        className="absolute right-6 top-5 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {loading && (
        <div className="flex h-full items-center justify-center">
          <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-4 text-sm backdrop-blur-xl">
            Đang tạo phòng gọi nhóm…
          </div>
        </div>
      )}

      {error && (
        <div className="flex h-full items-center justify-center px-6">
          <div className="max-w-md rounded-3xl border border-red-400/30 bg-red-500/10 px-6 py-5 text-center text-red-100 backdrop-blur-xl">
            <div className="mb-2 text-lg font-semibold">LiveKit chưa sẵn sàng</div>
            <p className="text-sm text-red-100/80">{error}</p>
          </div>
        </div>
      )}

      {url && token && !error && (
        <LiveKitRoom
          serverUrl={url}
          token={token}
          connect
          video
          audio
          onDisconnected={onClose}
          className="h-full"
        >
          <VideoConference />
        </LiveKitRoom>
      )}
    </div>
  );
};
