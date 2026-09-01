'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { AlertCircle, LoaderCircle, Lock, Phone, PhoneOff, Radio, RotateCcw, Video } from 'lucide-react';
import api from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';

function resolveLiveKitUrl(rawUrl: string) {
  if (typeof window === 'undefined') return rawUrl;
  if (window.location.protocol === 'https:' && rawUrl.startsWith('ws://')) {
    throw new Error('LIVEKIT_URL đang dùng ws:// trong trang HTTPS. Trình duyệt sẽ chặn WebSocket nên không thấy màn hình đối phương. Hãy cấu hình LiveKit bằng wss:// qua domain có SSL.');
  }
  return rawUrl;
}

interface Props {
  conversationId: string;
  title: string;
  avatarUrl?: string | null;
  isVideo: boolean;
  onClose: () => void;
}

function AutoPublishMedia({
  isVideo,
  onReady,
  onFailure,
}: {
  isVideo: boolean;
  onReady: () => void;
  onFailure: (message: string) => void;
}) {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    let cancelled = false;

    const publish = async () => {
      try {
        // LiveKit recommends these APIs to create and publish local tracks.
        await localParticipant.setMicrophoneEnabled(true);
        if (isVideo) await localParticipant.setCameraEnabled(true);
        if (!cancelled) onReady();
      } catch (error) {
        if (!cancelled) {
          onFailure(
            error instanceof Error
              ? error.message
              : 'Không thể bật camera hoặc micro.',
          );
        }
      }
    };

    void publish();
    return () => {
      cancelled = true;
    };
  }, [isVideo, localParticipant, onFailure, onReady]);

  return null;
}

export const LiveKitDirectCall = ({ conversationId, title, avatarUrl, isVideo, onClose }: Props) => {
  const { user } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaEnabled, setMediaEnabled] = useState(false);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState('Camera và micro sẽ tự động bật');
  const [statusText, setStatusText] = useState('Đang chuẩn bị phòng LiveKit…');
  const [retryNonce, setRetryNonce] = useState(0);
  const displayName = (title || 'Cuộc gọi').trim() || 'Cuộc gọi';
  const avatarFallback = displayName.charAt(0).toUpperCase();
  const handleMediaReady = useCallback(() => {
    setMediaEnabled(true);
    setDeviceStatus(isVideo ? 'Camera và micro đang bật' : 'Micro đang bật');
  }, [isVideo]);
  const handleMediaFailure = useCallback((message: string) => {
    setMediaEnabled(false);
    setDeviceStatus('Cần cấp quyền camera và micro');
    setError(`Không mở được camera/micro: ${message}`);
  }, []);

  useEffect(() => {
    if (!connectedAt) return;
    const updateElapsed = () => setElapsedSeconds(Math.floor((Date.now() - connectedAt) / 1000));
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [connectedAt]);

  const callDuration = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  useEffect(() => {
    let cancelled = false;

    const loadToken = async () => {
      try {
        setLoading(true);
        setMediaEnabled(false);
        setError(null);
        setStatusText('Đang lấy token LiveKit…');
        if (!conversationId) {
          throw new Error('Đang tạo phòng LiveKit, vui lòng thử lại sau vài giây.');
        }
        const res = await api.post('/chat/calls/livekit/token', {
          conversationId,
          displayName: (user as any)?.fullName || user?.email || 'Người dùng',
        });
        const data = res.data?.data ?? res.data;
        if (cancelled) return;
        if (!data?.token || !data?.url) {
          throw new Error('LiveKit token response thiếu token/url.');
        }
        setToken(data.token);
        setUrl(resolveLiveKitUrl(data.url));
        setStatusText('Đang vào phòng LiveKit…');
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || 'Không tạo được phòng gọi LiveKit.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadToken();
    return () => {
      cancelled = true;
    };
  }, [conversationId, user, retryNonce]);

  return (
    <div className="livekit-direct-call fixed inset-0 z-[130] overflow-hidden bg-[#080b12] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_80%_85%,rgba(14,165,233,0.10),transparent_32%)]" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-black/75 via-black/30 to-transparent px-4 pb-12 pt-[calc(1rem+env(safe-area-inset-top))] md:px-6 md:pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 shadow-lg backdrop-blur-xl md:px-4">
        <Avatar src={avatarUrl || undefined} fallback={avatarFallback} size="md" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight md:text-base">{displayName}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/65" aria-live="polite">
              {connectedAt ? <Radio className="h-3.5 w-3.5 text-emerald-400" /> : isVideo ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
              <span>{connectedAt ? `Đã kết nối · ${callDuration}` : isVideo ? 'Đang kết nối video…' : 'Đang kết nối thoại…'}</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/60 backdrop-blur-xl sm:flex">
            <Lock className="h-3.5 w-3.5" /> Kết nối bảo mật
          </div>
          <button onClick={onClose} aria-label="Kết thúc cuộc gọi" className="group flex h-11 items-center gap-2 rounded-full bg-red-500 px-3.5 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:px-4">
            <PhoneOff className="h-5 w-5 transition-transform group-hover:rotate-6" />
            <span className="hidden sm:inline">Kết thúc</span>
          </button>
        </div>
      </header>

      {loading && (
        <div className="relative flex h-full items-center justify-center px-6">
          <div className="flex max-w-sm flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/20" />
              <Avatar src={avatarUrl || undefined} fallback={avatarFallback} size="xl" className="relative h-28 w-28 border-4 border-white/10 shadow-2xl" />
            </div>
            <LoaderCircle className="mb-3 h-5 w-5 animate-spin text-blue-400" />
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="mt-2 text-sm text-white/55">{statusText}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="relative flex h-full items-center justify-center px-6">
          <div role="alert" className="max-w-md rounded-2xl border border-red-400/20 bg-[#171015]/90 px-7 py-7 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-300"><AlertCircle className="h-6 w-6" /></div>
            <h2 className="text-lg font-semibold">Không thể kết nối cuộc gọi</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">{error}</p>
            <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
              <button onClick={onClose} className="min-h-11 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Quay lại tin nhắn</button>
              <button onClick={() => setRetryNonce(value => value + 1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><RotateCcw className="h-4 w-4" /> Thử kết nối lại</button>
            </div>
          </div>
        </div>
      )}

      {url && token && !error && (
        <LiveKitRoom
          serverUrl={url}
          token={token}
          connect
          video={false}
          audio={false}
          onConnected={() => {
            setStatusText('Đã kết nối LiveKit. Nếu chưa thấy hình, chờ đối phương bật camera hoặc kiểm tra quyền camera.');
            setConnectedAt(Date.now());
          }}
          onError={(err: Error) => setError(err.message || 'LiveKit kết nối lỗi.')}
          onMediaDeviceFailure={(failure: unknown) => setError(`Không mở được camera/micro: ${String(failure)}`)}
          onDisconnected={() => {
            setMediaEnabled(false);
            setConnectedAt(null);
            onClose();
          }}
          className="h-full"
        >
          <AutoPublishMedia
            isVideo={isVideo}
            onReady={handleMediaReady}
            onFailure={handleMediaFailure}
          />
          <VideoConference />
        </LiveKitRoom>
      )}

      {connectedAt && !error && (
        <div className="pointer-events-none absolute bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] font-medium text-white/55 backdrop-blur-xl md:bottom-24">
          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${mediaEnabled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {deviceStatus}
        </div>
      )}
    </div>
  );
};
