'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  VideoTrack,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { AlertCircle, LoaderCircle, LockKeyhole, Mic, MicOff, Radio, Signal, Video, VideoOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { LiveStream, useEndLiveStream } from '@/hooks/useLiveStreams';
import { useAuthStore } from '@/store/authStore';

function safeLiveKitUrl(url: string) {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('ws://')) {
    throw new Error('Máy chủ LiveKit chưa được cấu hình kết nối bảo mật wss://');
  }
  return url;
}

function HostPublisher({ onError }: { onError: (message: string) => void }) {
  const { localParticipant } = useLocalParticipant();
  const [microphone, setMicrophone] = useState(false);
  const [camera, setCamera] = useState(false);

  useEffect(() => {
    let active = true;
    const enableDevices = async () => {
      try {
        await localParticipant.setCameraEnabled(true);
        if (active) setCamera(localParticipant.isCameraEnabled);
      } catch (error) {
        if (active) onError(error instanceof Error ? error.message : 'Không thể bật camera');
      }

      try {
        await localParticipant.setMicrophoneEnabled(true);
        if (active) setMicrophone(localParticipant.isMicrophoneEnabled);
      } catch (error) {
        if (active) onError(error instanceof Error ? error.message : 'Không thể bật micro');
      }
    };
    void enableDevices();
    return () => { active = false; };
  }, [localParticipant, onError]);

  const toggleMicrophone = async () => {
    try { await localParticipant.setMicrophoneEnabled(!microphone); setMicrophone(localParticipant.isMicrophoneEnabled); }
    catch { onError('Không thể thay đổi trạng thái micro'); }
  };
  const toggleCamera = async () => {
    try { await localParticipant.setCameraEnabled(!camera); setCamera(localParticipant.isCameraEnabled); }
    catch { onError('Không thể thay đổi trạng thái camera'); }
  };

  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-[#10131b]/85 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl sm:bottom-6">
      <button onClick={toggleMicrophone} aria-pressed={microphone} aria-label={microphone ? 'Tắt micro' : 'Bật micro'} className={`flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-xl outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-400 ${microphone ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-600 text-white hover:bg-red-500'}`}>{microphone ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button>
      <div className="h-7 w-px bg-white/10" aria-hidden="true" />
      <button onClick={toggleCamera} aria-pressed={camera} aria-label={camera ? 'Tắt camera' : 'Bật camera'} className={`flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-xl outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-400 ${camera ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-600 text-white hover:bg-red-500'}`}>{camera ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}</button>
    </div>
  );
}

function LiveStage({ hostId }: { hostId: string }) {
  // Local host publications are not subscriptions. Include them so the host can
  // see their own camera preview while viewers still receive subscribed tracks.
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: false });
  const hostCamera = tracks.find((track) =>
    track.participant.identity === hostId &&
    track.source === Track.Source.Camera &&
    Boolean(track.publication.track),
  );
  const hostScreen = tracks.find((track) =>
    track.participant.identity === hostId &&
    track.source === Track.Source.ScreenShare &&
    Boolean(track.publication.track),
  );
  const hostTrack = hostScreen ?? hostCamera;

  if (!hostTrack) {
    return <div className="flex h-full flex-col items-center justify-center px-6 text-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]"><VideoOff className="h-7 w-7 text-white/55" /></div><p className="font-semibold text-white/90">Camera chưa được bật</p><p className="mt-2 max-w-xs text-sm leading-6 text-white/50">Hình ảnh sẽ xuất hiện tại đây ngay khi người phát bật camera.</p></div>;
  }
  return <VideoTrack trackRef={hostTrack} playsInline className="h-full w-full object-contain" />;
}

export function LiveStreamRoom({ stream }: { stream: LiveStream }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHost = user?.id === stream.hostId;
  const endStream = useEndLiveStream();
  const [token, setToken] = useState<string>();
  const [serverUrl, setServerUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [mediaWarning, setMediaWarning] = useState<string>();
  const [connected, setConnected] = useState(false);
  const reportMediaError = useCallback((message: string) => setMediaWarning(message), []);

  useEffect(() => {
    let cancelled = false;
    api.post(`/chat/live-streams/${encodeURIComponent(stream.id)}/token`)
      .then((response) => {
        const data = response.data?.data ?? response.data;
        if (!data?.token || !data?.url) throw new Error('Phản hồi LiveKit không hợp lệ');
        if (!cancelled) { setToken(data.token); setServerUrl(safeLiveKitUrl(data.url)); }
      })
      .catch((requestError) => !cancelled && setError(requestError?.response?.data?.message || requestError.message || 'Không thể vào livestream'));
    return () => { cancelled = true; };
  }, [stream.id]);

  const finish = async () => {
    if (!window.confirm('Kết thúc livestream cho tất cả người xem?')) return;
    try { await endStream.mutateAsync(stream.id); toast.success('Đã kết thúc livestream'); router.push('/feed'); }
    catch (requestError: any) { toast.error(requestError?.response?.data?.message || 'Không thể kết thúc livestream'); }
  };

  if (stream.status !== 'LIVE') {
    return <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted"><Radio className="h-7 w-7 text-muted-foreground" /></div><h1 className="text-2xl font-bold">Livestream đã kết thúc</h1><p className="mt-2 text-muted-foreground">Buổi phát này không còn trực tuyến.</p><button onClick={() => router.push('/feed')} className="mt-6 min-h-11 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground">Về bảng tin</button></div>;
  }

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#090b10] text-white selection:bg-red-500/30">
      <main className="mx-auto grid min-h-[100dvh] max-w-[1920px] grid-rows-[minmax(58dvh,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-1">
        <section className="relative isolate min-h-[58dvh] overflow-hidden bg-[#050608] lg:min-h-[100dvh]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(37,99,235,0.10),transparent_45%)]" aria-hidden="true" />

          <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 via-black/35 to-transparent px-4 pb-12 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-full ring-2 ring-white/15"><Avatar src={stream.host.avatarUrl || undefined} fallback={stream.host.fullName.charAt(0)} /></div>
              <div className="min-w-0"><div className="flex items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[10px] font-extrabold tracking-[0.12em]"><span className="h-1.5 w-1.5 rounded-full bg-white motion-safe:animate-pulse" />LIVE</span><span className="truncate text-sm font-semibold">{stream.host.fullName}</span></div><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-white/60"><Signal className={`h-3.5 w-3.5 ${connected ? 'text-emerald-400' : 'text-amber-400'}`} />{connected ? isHost ? 'Đang phát ổn định' : 'Đang xem trực tiếp' : 'Đang kết nối…'}</p></div>
            </div>
            <div className="flex items-center gap-2">{isHost && <button disabled={endStream.isPending} onClick={finish} className="min-h-11 cursor-pointer rounded-xl bg-red-600 px-4 text-sm font-semibold outline-none transition-colors duration-200 hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50">{endStream.isPending ? 'Đang kết thúc…' : 'Kết thúc'}</button>}<button onClick={() => router.push('/feed')} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/35 outline-none backdrop-blur-md transition-colors duration-200 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Rời livestream"><X className="h-5 w-5" /></button></div>
          </header>

          <div className="relative z-10 h-full min-h-[58dvh] lg:min-h-[100dvh]">
            {!token && !error && <div className="flex h-full min-h-[58dvh] flex-col items-center justify-center gap-3 text-white/65"><LoaderCircle className="h-8 w-8 animate-spin text-red-500 motion-reduce:animate-none" /><p className="text-sm font-medium">Đang chuẩn bị phòng phát…</p></div>}
            {error && <div role="alert" className="flex h-full min-h-[58dvh] flex-col items-center justify-center px-6 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10"><AlertCircle className="h-7 w-7 text-red-400" /></div><h2 className="text-lg font-semibold">Không thể kết nối livestream</h2><p className="mt-2 max-w-md text-sm leading-6 text-white/60">{error}</p><button onClick={() => window.location.reload()} className="mt-5 min-h-11 cursor-pointer rounded-xl bg-white px-4 text-sm font-semibold text-[#090b10] outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-blue-400">Thử lại</button></div>}
            {token && serverUrl && !error && <LiveKitRoom token={token} serverUrl={serverUrl} connect video={false} audio={false} onConnected={() => setConnected(true)} onError={(roomError) => setError(roomError.message)} onDisconnected={() => setConnected(false)} className="h-full min-h-[58dvh] lg:min-h-[100dvh]"><LiveStage hostId={stream.hostId} />{isHost && <HostPublisher onError={reportMediaError} />}<RoomAudioRenderer /><StartAudio label="Bật âm thanh" /></LiveKitRoom>}
          </div>

          {mediaWarning && <div role="status" className="absolute bottom-20 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-amber-300/20 bg-amber-950/85 px-4 py-3 text-sm text-amber-50 shadow-xl backdrop-blur-xl sm:bottom-24"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div className="min-w-0"><p className="font-semibold">Kiểm tra quyền thiết bị</p><p className="mt-1 break-words text-xs leading-5 text-amber-100/75">{mediaWarning}</p></div><button onClick={() => setMediaWarning(undefined)} className="ml-auto flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-white/10" aria-label="Đóng cảnh báo"><X className="h-4 w-4" /></button></div></div>}
        </section>

        <aside className="flex min-h-0 flex-col border-t border-white/[0.08] bg-[#10131b] lg:max-h-[100dvh] lg:border-l lg:border-t-0">
          <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6 lg:pt-[calc(1.5rem+env(safe-area-inset-top))]"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-red-400"><Radio className="h-4 w-4" />Đang trực tiếp</div><h1 className="mt-3 text-xl font-bold leading-snug tracking-[-0.02em] sm:text-2xl">{stream.title}</h1>{stream.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">{stream.description}</p>}</div>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <section aria-labelledby="broadcaster-title" className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><p id="broadcaster-title" className="text-xs font-medium text-white/45">Người phát</p><div className="mt-3 flex items-center gap-3"><Avatar src={stream.host.avatarUrl || undefined} fallback={stream.host.fullName.charAt(0)} /><div className="min-w-0"><p className="truncate font-semibold">{stream.host.fullName}</p><p className="mt-0.5 text-xs text-white/45">Đang trực tuyến</p></div><span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/10" aria-label="Đang trực tuyến" /></div></section>
            <section aria-labelledby="privacy-title" className="rounded-2xl border border-white/[0.08] p-4"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300"><LockKeyhole className="h-4 w-4" /></div><div><h2 id="privacy-title" className="text-sm font-semibold">Kết nối an toàn</h2><p className="mt-1.5 text-xs leading-5 text-white/50">{isHost ? 'Camera và micro chỉ được phát sau khi bạn cấp quyền. Bạn có thể tắt bất kỳ lúc nào.' : 'Bạn đang ở chế độ chỉ xem. Camera và micro của bạn không được sử dụng.'}</p></div></div></section>
          </div>
          <div className="border-t border-white/[0.08] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6"><p className="flex items-center justify-center gap-2 text-xs text-white/35"><span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />{connected ? 'Kết nối qua LiveKit' : 'Đang thiết lập kết nối'}</p></div>
        </aside>
      </main>
    </div>
  );
}
