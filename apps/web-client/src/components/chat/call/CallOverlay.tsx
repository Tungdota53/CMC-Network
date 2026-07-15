'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CallControls } from './CallControls';
import { CallTimer } from './CallTimer';
import { Avatar } from '@/components/ui/Avatar';
import { MicOff, SignalHigh, SignalLow, SignalMedium, VideoOff } from 'lucide-react';

interface Props {
  name: string;
  avatarUrl?: string | null;
  isVideo: boolean;
  status: 'calling' | 'connected';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'unknown' | 'good' | 'fair' | 'poor';
  devices: Array<{ deviceId: string; label: string; kind: MediaDeviceKind }>;
  selectedAudioInputId: string | null;
  selectedVideoInputId: string | null;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onRefreshDevices: () => void;
  onSwitchAudioInput: (deviceId: string) => void;
  onSwitchVideoInput: (deviceId: string) => void;
  onEndCall: () => void;
}

export const CallOverlay = ({
  name,
  avatarUrl,
  isVideo,
  status,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  isScreenSharing,
  connectionQuality,
  devices,
  selectedAudioInputId,
  selectedVideoInputId,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onRefreshDevices,
  onSwitchAudioInput,
  onSwitchVideoInput,
  onEndCall,
}: Props) => {
  const displayName = (name || 'Cuộc gọi').trim() || 'Cuộc gọi';
  const avatarFallback = displayName.charAt(0).toUpperCase();
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [localPreviewReady, setLocalPreviewReady] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return;

    if (!localStream || isVideoOff) {
      video.srcObject = null;
      setLocalPreviewReady(false);
      return;
    }

    setLocalPreviewReady(false);
    video.srcObject = localStream;
    void video.play().catch(() => setLocalPreviewReady(false));
  }, [localStream, isVideoOff]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      void remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      void remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!showControls) return;
    const t = setTimeout(() => setShowControls(false), 5000);
    return () => clearTimeout(t);
  }, [showControls]);

  const hasRemoteVideo = !!remoteStream?.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled);
  const hasLocalVideo = !!localStream?.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled);
  const showRemoteVideo = isVideo && hasRemoteVideo && status === 'connected';
  const showLocalPreview = isVideo && !isVideoOff;
  const qualityLabel = {
    unknown: 'Đang đo mạng',
    good: 'Mạng tốt',
    fair: 'Mạng trung bình',
    poor: 'Mạng yếu',
  }[connectionQuality];
  const qualityClass = {
    unknown: 'bg-white/10 text-white',
    good: 'bg-emerald-500/20 text-emerald-200',
    fair: 'bg-amber-500/20 text-amber-200',
    poor: 'bg-red-500/20 text-red-200',
  }[connectionQuality];
  const QualityIcon = {
    unknown: SignalMedium,
    good: SignalHigh,
    fair: SignalMedium,
    poor: SignalLow,
  }[connectionQuality];
  const audioInputs = devices.filter((device) => device.kind === 'audioinput');
  const videoInputs = devices.filter((device) => device.kind === 'videoinput');

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_38%,#020617_100%)] text-white"
      onClick={() => setShowControls(true)}
    >
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {showRemoteVideo ? (
        <div className="w-full h-full relative bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute left-4 top-5 z-10 md:left-8 md:top-8">
            <h2 className="text-2xl font-bold mb-1 drop-shadow-md">{displayName}</h2>
            <div className="drop-shadow-md">
              <CallTimer />
            </div>
            <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${qualityClass}`}>
              <QualityIcon className="h-3.5 w-3.5" /> {qualityLabel}{isScreenSharing ? ' · Đang chia sẻ màn hình' : ''}
            </div>
          </div>
          {isMuted && <div className="absolute right-4 top-5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-100 backdrop-blur md:right-6 md:top-6"><MicOff className="mr-1 inline h-3.5 w-3.5" /> Micro tắt</div>}
        </div>
      ) : (
        <div className="flex max-w-[92vw] flex-col items-center text-center animate-in zoom-in-95">
          <Avatar
            size="xl"
            src={avatarUrl || undefined}
            fallback={avatarFallback}
            className="w-32 h-32 mb-6"
          />
          <h2 className="text-2xl font-bold mb-2">{displayName}</h2>
          {status === 'calling' ? (
            <div className="flex flex-col items-center gap-3">
              <p className="animate-pulse text-gray-300">Đang gọi…</p>
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" /> Chờ người nhận bắt máy
              </div>
            </div>
          ) : (
            <CallTimer />
          )}
          {status === 'connected' && (
            <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${qualityClass}`}>
              <QualityIcon className="h-3.5 w-3.5" /> {qualityLabel}{isScreenSharing ? ' · Đang chia sẻ màn hình' : ''}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-white/60">
            {isMuted && <span className="rounded-full bg-red-500/20 px-3 py-1 text-red-100"><MicOff className="mr-1 inline h-3.5 w-3.5" /> Micro tắt</span>}
            {isVideoOff && isVideo && <span className="rounded-full bg-white/10 px-3 py-1"><VideoOff className="mr-1 inline h-3.5 w-3.5" /> Camera tắt</span>}
          </div>
        </div>
      )}

      {showLocalPreview && (
        <div className="absolute bottom-24 right-3 z-[105] h-36 w-28 overflow-hidden rounded-2xl border-2 border-white/25 bg-white/10 text-white shadow-2xl backdrop-blur md:bottom-28 md:right-6 md:h-56 md:w-40">
          {hasLocalVideo && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setLocalPreviewReady(true)}
              onCanPlay={() => setLocalPreviewReady(true)}
              className={`h-full w-full scale-x-[-1] object-cover transition-opacity duration-200 ${localPreviewReady ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          {(!hasLocalVideo || !localPreviewReady) && (
            <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-white/70">
              Camera chưa có hình
            </div>
          )}
        </div>
      )}

      {showControls && (
        <CallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={onToggleMute}
          onToggleVideo={onToggleVideo}
          onToggleScreenShare={onToggleScreenShare}
          onEndCall={onEndCall}
          onOpenSettings={() => {
            setShowSettings((value) => !value);
            onRefreshDevices();
          }}
        />
      )}

      {showSettings && (
        <div className="absolute inset-x-3 bottom-24 z-[110] rounded-3xl border border-white/10 bg-gray-950/90 p-5 text-white shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-28 md:right-6 md:w-80">
          <div className="mb-4">
            <h3 className="text-base font-semibold">Cài đặt cuộc gọi</h3>
            <p className="text-xs text-white/60">Đổi micro/camera không cần ngắt cuộc gọi.</p>
          </div>

          <label className="mb-2 block text-xs font-medium text-white/70">Micro</label>
          <select
            value={selectedAudioInputId ?? ''}
            onChange={(event) => onSwitchAudioInput(event.target.value)}
            className="mb-4 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            <option value="">Micro mặc định</option>
            {audioInputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId} className="bg-gray-900">
                {device.label}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-xs font-medium text-white/70">Camera</label>
          <select
            value={selectedVideoInputId ?? ''}
            onChange={(event) => onSwitchVideoInput(event.target.value)}
            disabled={isScreenSharing}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Camera mặc định</option>
            {videoInputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId} className="bg-gray-900">
                {device.label}
              </option>
            ))}
          </select>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-white/70">
            <div className="rounded-xl bg-white/10 px-2 py-2">720p</div>
            <div className="rounded-xl bg-white/10 px-2 py-2">30 FPS</div>
            <div className="rounded-xl bg-white/10 px-2 py-2">TURN ready</div>
          </div>
        </div>
      )}
    </div>
  );
};
