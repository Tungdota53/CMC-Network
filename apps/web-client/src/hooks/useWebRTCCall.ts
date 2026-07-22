'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import api from '@/lib/api';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export type CallQuality = 'unknown' | 'good' | 'fair' | 'poor';

export interface CallDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface IncomingCall {
  from: string;
  callerName: string;
  callerAvatar?: string;
  isVideo: boolean;
  signal: RTCSessionDescriptionInit;
  conversationId?: string;
}

const CALL_TIMEOUT_MS = 45_000;

interface CallState {
  status: CallStatus;
  isVideo: boolean;
  error: string | null;
  peerId: string | null;
  peerName: string | null;
  peerAvatar?: string | null;
  conversationId?: string | null;
  incoming: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  connectionQuality: CallQuality;
  devices: CallDevice[];
  selectedAudioInputId: string | null;
  selectedVideoInputId: string | null;
}

function getIceServers(): RTCIceServer[] {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:443' },
    { urls: 'stun:openrelay.metered.ca:80' },
  ];
}

const DEFAULT_ICE_CONFIG: RTCConfiguration = {
  bundlePolicy: 'max-bundle',
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10,
  iceServers: getIceServers(),
};

const MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user',
  },
} satisfies MediaStreamConstraints;

function unwrapSessionDescription(
  payload: RTCSessionDescriptionInit | { signal: RTCSessionDescriptionInit },
) {
  return 'signal' in payload ? payload.signal : payload;
}

function unwrapIceCandidate(
  payload: RTCIceCandidateInit | { candidate: RTCIceCandidateInit },
) {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'candidate' in payload &&
    typeof payload.candidate === 'object'
  ) {
    return payload.candidate;
  }
  return payload as RTCIceCandidateInit;
}

/**
 * useWebRTCCall — realtime 1:1 audio/video calls over the chat socket.
 *
 * Signaling contract (matches chat-service ChatGateway):
 *  - emit  `callUser`     { userToCall, signalData(offer), from, isVideo, callerName, callerAvatar }
 *  - emit  `answerCall`   { to, signal(answer) }
 *  - emit  `iceCandidate` { to, candidate }
 *  - emit  `endCall`      { to }
 *  - on    `receiveCall-<myId>`  { signal(offer), from, callerName, callerAvatar, isVideo }
 *  - on    `callAccepted-<myId>` answer(signal)
 *  - on    `iceCandidate-<myId>` candidate
 *  - on    `callEnded-<myId>`
 */
export function useWebRTCCall(
  socket: Socket | null,
  myId: string | undefined,
  myName: string | undefined,
  myAvatar?: string | null,
) {
  const [state, setState] = useState<CallState>({
    status: 'idle',
    isVideo: false,
    error: null,
    peerId: null,
    peerName: null,
    peerAvatar: null,
    conversationId: null,
    incoming: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    connectionQuality: 'unknown',
    devices: [],
    selectedAudioInputId: null,
    selectedVideoInputId: null,
  });

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const iceConfigRef = useRef<RTCConfiguration>(DEFAULT_ICE_CONFIG);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const stateRef = useRef<CallState>(state);
  const qualityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBytesReceivedRef = useRef<number>(0);
  const lastStatsAtRef = useRef<number>(0);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cleanup = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => {
      try {
        s.track?.stop();
      } catch { }
    });
    try {
      pcRef.current?.close();
    } catch { }
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    cameraTrackRef.current = null;
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    peerIdRef.current = null;
    pendingCandidates.current = [];
    remoteStreamRef.current = null;
    if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);
    qualityTimerRef.current = null;
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = null;
    lastBytesReceivedRef.current = 0;
    lastStatsAtRef.current = 0;
  }, []);

  const resetState = useCallback(() => {
    setState({
      status: 'idle',
      isVideo: false,
      error: null,
      peerId: null,
      peerName: null,
      peerAvatar: null,
      conversationId: null,
      incoming: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      connectionQuality: 'unknown',
      devices: [],
      selectedAudioInputId: null,
      selectedVideoInputId: null,
    });
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const rawDevices = await navigator.mediaDevices.enumerateDevices();
    const devices = rawDevices
      .filter((device) => device.kind === 'audioinput' || device.kind === 'videoinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        kind: device.kind,
        label: device.label || `${device.kind === 'audioinput' ? 'Micro' : 'Camera'} ${index + 1}`,
      }));
    setState((prev) => ({ ...prev, devices }));
  }, []);

  const startQualityMonitor = useCallback((pc: RTCPeerConnection) => {
    if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);
    qualityTimerRef.current = setInterval(async () => {
      try {
        const stats = await pc.getStats();
        let bytesReceived = 0;
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && !report.isRemote) {
            bytesReceived += Number(report.bytesReceived ?? 0);
          }
        });

        const now = Date.now();
        const elapsed = lastStatsAtRef.current ? (now - lastStatsAtRef.current) / 1000 : 0;
        const delta = bytesReceived - lastBytesReceivedRef.current;
        lastBytesReceivedRef.current = bytesReceived;
        lastStatsAtRef.current = now;
        if (!elapsed || delta < 0) return;

        const kbps = (delta * 8) / elapsed / 1000;
        const quality: CallQuality = kbps > 250 ? 'good' : kbps > 80 ? 'fair' : 'poor';
        setState((prev) => ({ ...prev, connectionQuality: quality }));
      } catch {
        setState((prev) => ({ ...prev, connectionQuality: 'unknown' }));
      }
    }, 3000);
  }, []);

  const loadIceConfig = useCallback(async () => {
    try {
      const res = await api.get('/chat/webrtc/ice-servers');
      const iceServers = res.data?.iceServers || res.data?.data?.iceServers;
      if (Array.isArray(iceServers) && iceServers.length > 0) {
        iceConfigRef.current = {
          ...DEFAULT_ICE_CONFIG,
          iceServers,
        };
      }
    } catch (error) {
      console.warn('[Call] Failed to load ICE servers, using fallback STUN', error);
      iceConfigRef.current = DEFAULT_ICE_CONFIG;
    }
  }, []);

  const createPeer = useCallback(
    (peerId: string) => {
      const pc = new RTCPeerConnection(iceConfigRef.current);

      pc.onicecandidate = (e) => {
        if (e.candidate && socket) {
          socket.emit('iceCandidate', { to: peerId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        const remoteStream = e.streams[0] ?? remoteStreamRef.current ?? new MediaStream();
        remoteStreamRef.current = remoteStream;

        if (!remoteStream.getTracks().some((track) => track.id === e.track.id)) {
          remoteStream.addTrack(e.track);
        }

        setState((prev) => ({ ...prev, remoteStream: new MediaStream(remoteStream.getTracks()), status: 'connected' }));
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
          setState((prev) => ({ ...prev, status: 'connected', error: null }));
        }

        if (pc.connectionState === 'disconnected') {
          setState((prev) => ({ ...prev, error: 'Mạng chập chờn, đang cố nối lại cuộc gọi...' }));
        }

        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          // Peer dropped — tear the call down locally.
          cleanup();
          setState((prev) => ({
            ...prev,
            status: 'idle',
            error: 'Cuộc gọi bị ngắt do kết nối không ổn định.',
            localStream: null,
            remoteStream: null,
          }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          try {
            pc.restartIce();
            setState((prev) => ({ ...prev, error: 'Đang khôi phục đường truyền...' }));
          } catch { }
        }
      };

      pcRef.current = pc;
      startQualityMonitor(pc);
      return pc;
    },
    [socket, cleanup, resetState, startQualityMonitor],
  );

  const describeMediaError = (err: unknown, isVideo: boolean) => {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Trình duyệt đang chặn quyền camera/micro. Hãy cấp quyền rồi gọi lại.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return isVideo
        ? 'Không tìm thấy camera. Đã thử chuyển sang gọi thoại.'
        : 'Không tìm thấy micro.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'Camera/micro đang bị ứng dụng khác dùng.';
    }
    return 'Không mở được camera/micro.';
  };

  const getMedia = useCallback(async (isVideo: boolean) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Trình duyệt không hỗ trợ gọi WebRTC hoặc đang chạy ngoài HTTPS/localhost.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...MEDIA_CONSTRAINTS.audio,
          ...(stateRef.current.selectedAudioInputId
            ? { deviceId: { exact: stateRef.current.selectedAudioInputId } }
            : {}),
        },
        video: isVideo
          ? {
            ...MEDIA_CONSTRAINTS.video,
            ...(stateRef.current.selectedVideoInputId
              ? { deviceId: { exact: stateRef.current.selectedVideoInputId } }
              : {}),
          }
          : false,
      });
      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
      setState((prev) => ({ ...prev, localStream: stream, error: null }));
      void refreshDevices();
      return stream;
    } catch (err) {
      if (isVideo) {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            audio: MEDIA_CONSTRAINTS.audio,
            video: false,
          });
          localStreamRef.current = audioOnly;
          cameraTrackRef.current = null;
          void refreshDevices();
          setState((prev) => ({
            ...prev,
            isVideo: false,
            localStream: audioOnly,
            error: describeMediaError(err, true),
          }));
          return audioOnly;
        } catch (audioErr) {
          throw new Error(describeMediaError(audioErr, false));
        }
      }
      throw new Error(describeMediaError(err, false));
    }
  }, [refreshDevices]);

  // ---- Outgoing call ----
  const startCall = useCallback(
    async (
      peerId: string,
      peerName: string,
      isVideo: boolean,
      peerAvatar?: string | null,
      conversationId?: string,
    ) => {
      if (!socket || !myId) return;
      peerIdRef.current = peerId;
      setState((prev) => ({
        ...prev,
        status: 'calling',
        isVideo,
        error: null,
        peerId,
        peerName,
        peerAvatar: peerAvatar ?? null,
        conversationId: conversationId ?? null,
      }));

      try {
        const stream = await getMedia(isVideo);
        await loadIceConfig();
        const pc = createPeer(peerId);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('callUser', {
          userToCall: peerId,
          signalData: offer,
          from: myId,
          isVideo,
          callerName: myName || 'Người dùng',
          callerAvatar: myAvatar ?? undefined,
          conversationId,
        });

        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = setTimeout(() => {
          const current = stateRef.current;
          if (current.status !== 'calling') return;
          socket.emit('endCall', { to: peerId });
          cleanup();
          setState((prev) => ({
            ...prev,
            status: 'idle',
            error: 'Không ai trả lời cuộc gọi.',
            peerId: null,
            peerName: null,
            peerAvatar: null,
            localStream: null,
            remoteStream: null,
          }));
        }, CALL_TIMEOUT_MS);
      } catch (err) {
        console.error('[Call] startCall failed', err);
        setState((prev) => ({
          ...prev,
          status: 'idle',
          error: err instanceof Error ? err.message : 'Không bắt đầu được cuộc gọi.',
        }));
        cleanup();
      }
    },
    [socket, myId, myName, myAvatar, getMedia, loadIceConfig, createPeer, cleanup],
  );

  const startLiveKitCall = useCallback(
    async (
      peerId: string,
      peerName: string,
      isVideo: boolean,
      peerAvatar?: string | null,
      conversationId?: string,
    ) => {
      if (!socket || !myId) return;
      let resolvedConversationId = conversationId;
      if (!resolvedConversationId) {
        try {
          const res = await api.post('/chat/conversations/direct', {
            user1Id: myId,
            user2Id: peerId,
          });
          const payload = res.data?.data ?? res.data;
          resolvedConversationId = payload?.id;
        } catch (err) {
          console.error('[Call] create direct conversation failed', err);
          setState((prev) => ({
            ...prev,
            status: 'idle',
            error: 'Không tạo được cuộc trò chuyện để mở phòng LiveKit.',
          }));
          return;
        }
      }

      if (!resolvedConversationId) {
        setState((prev) => ({
          ...prev,
          status: 'idle',
          error: 'Thiếu conversationId nên không thể mở phòng LiveKit.',
        }));
        return;
      }

      peerIdRef.current = peerId;
      setState((prev) => ({
        ...prev,
        status: 'calling',
        isVideo,
        error: null,
        peerId,
        peerName,
        peerAvatar: peerAvatar ?? null,
        conversationId: resolvedConversationId,
      }));

      socket.emit('callUser', {
        userToCall: peerId,
        signalData: { type: 'livekit' },
        from: myId,
        isVideo,
        callerName: myName || 'Người dùng',
        callerAvatar: myAvatar ?? undefined,
        conversationId: resolvedConversationId,
      });

      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = setTimeout(() => {
        const current = stateRef.current;
        if (current.status !== 'calling') return;
        socket.emit('endCall', { to: peerId });
        cleanup();
        setState((prev) => ({
          ...prev,
          status: 'idle',
          error: 'Không ai trả lời cuộc gọi.',
          peerId: null,
          peerName: null,
          peerAvatar: null,
          conversationId: null,
        }));
      }, CALL_TIMEOUT_MS);
    },
    [socket, myId, myName, myAvatar, cleanup],
  );

  // ---- Answer incoming call ----
  const answerCall = useCallback(async () => {
    if (!socket || !state.incoming) return;
    const { from, signal, isVideo, callerName, callerAvatar, conversationId } = state.incoming;
    peerIdRef.current = from;

    setState((prev) => ({
      ...prev,
      status: 'connected',
      isVideo,
      error: null,
      peerId: from,
      peerName: callerName,
      peerAvatar: callerAvatar ?? null,
      conversationId: conversationId ?? null,
      incoming: null,
    }));

    try {
      const stream = await getMedia(isVideo);
      await loadIceConfig();
      const pc = createPeer(from);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      // Flush any ICE that arrived before remoteDescription was set.
      for (const c of pendingCandidates.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch { }
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answerCall', { to: from, signal: answer });
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    } catch (err) {
      console.error('[Call] answerCall failed', err);
      setState((prev) => ({
        ...prev,
        status: 'idle',
        error: err instanceof Error ? err.message : 'Không nhận được cuộc gọi.',
      }));
      cleanup();
    }
  }, [socket, state.incoming, getMedia, loadIceConfig, createPeer, cleanup]);

  const answerLiveKitCall = useCallback(() => {
    if (!socket || !state.incoming) return;
    const { from, isVideo, callerName, callerAvatar, conversationId } = state.incoming;
    peerIdRef.current = from;
    setState((prev) => ({
      ...prev,
      status: 'connected',
      isVideo,
      error: null,
      peerId: from,
      peerName: callerName,
      peerAvatar: callerAvatar ?? null,
      conversationId: conversationId ?? null,
      incoming: null,
    }));
    socket.emit('answerCall', { to: from, signal: { type: 'livekit-accepted' } });
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = null;
  }, [socket, state.incoming]);

  // ---- Reject / end call ----
  const endCall = useCallback(() => {
    const target = peerIdRef.current || state.incoming?.from || state.peerId;
    if (socket && target) socket.emit('endCall', { to: target });
    cleanup();
    resetState();
  }, [socket, state.incoming, state.peerId, cleanup, resetState]);

  const rejectCall = useCallback(() => {
    const target = state.incoming?.from;
    if (socket && target) socket.emit('rejectCall', { to: target });
    cleanup();
    resetState();
  }, [socket, state.incoming, cleanup, resetState]);

  // ---- Media toggles ----
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setState((prev) => ({ ...prev, isVideoOff: !prev.isVideoOff }));
  }, []);

  const replaceVideoTrack = useCallback(async (track: MediaStreamTrack | null) => {
    const pc = pcRef.current;
    const localStream = localStreamRef.current;
    if (!pc || !localStream || !track) return;

    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) {
      await sender.replaceTrack(track);
    } else {
      pc.addTrack(track, localStream);
    }

    localStream.getVideoTracks().forEach((oldTrack) => {
      if (oldTrack.id !== track.id) {
        localStream.removeTrack(oldTrack);
      }
    });
    localStream.addTrack(track);
    setState((prev) => ({ ...prev, localStream: new MediaStream(localStream.getTracks()) }));
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !localStreamRef.current) return;

    if (stateRef.current.isScreenSharing) {
      const cameraTrack = cameraTrackRef.current;
      await replaceVideoTrack(cameraTrack);
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      setState((prev) => ({ ...prev, isScreenSharing: false }));
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setState((prev) => ({ ...prev, error: 'Trình duyệt không hỗ trợ chia sẻ màn hình.' }));
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 30 } },
        audio: false,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;
      screenTrackRef.current = screenTrack;
      screenTrack.onended = () => {
        void toggleScreenShare();
      };
      await replaceVideoTrack(screenTrack);
      setState((prev) => ({ ...prev, isScreenSharing: true, isVideo: true, isVideoOff: false, error: null }));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') return;
      setState((prev) => ({ ...prev, error: 'Không chia sẻ được màn hình.' }));
    }
  }, [replaceVideoTrack]);

  const switchAudioInput = useCallback(async (deviceId: string) => {
    const pc = pcRef.current;
    const localStream = localStreamRef.current;
    const nextDeviceId = deviceId || null;
    if (!pc || !localStream) {
      setState((prev) => ({ ...prev, selectedAudioInputId: nextDeviceId }));
      return;
    }

    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: nextDeviceId
        ? { ...MEDIA_CONSTRAINTS.audio, deviceId: { exact: nextDeviceId } }
        : MEDIA_CONSTRAINTS.audio,
      video: false,
    });
    const newTrack = newStream.getAudioTracks()[0];
    if (!newTrack) return;
    const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
    await sender?.replaceTrack(newTrack);
    localStream.getAudioTracks().forEach((track) => {
      track.stop();
      localStream.removeTrack(track);
    });
    localStream.addTrack(newTrack);
    setState((prev) => ({
      ...prev,
      selectedAudioInputId: nextDeviceId,
      localStream: new MediaStream(localStream.getTracks()),
      isMuted: false,
    }));
  }, []);

  const switchVideoInput = useCallback(async (deviceId: string) => {
    if (stateRef.current.isScreenSharing) return;
    const localStream = localStreamRef.current;
    const nextDeviceId = deviceId || null;
    if (!localStream) {
      setState((prev) => ({ ...prev, selectedVideoInputId: nextDeviceId }));
      return;
    }

    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: nextDeviceId
        ? { ...MEDIA_CONSTRAINTS.video, deviceId: { exact: nextDeviceId } }
        : MEDIA_CONSTRAINTS.video,
    });
    const newTrack = newStream.getVideoTracks()[0];
    if (!newTrack) return;
    cameraTrackRef.current = newTrack;
    await replaceVideoTrack(newTrack);
    setState((prev) => ({
      ...prev,
      selectedVideoInputId: nextDeviceId,
      isVideo: true,
      isVideoOff: false,
    }));
  }, [replaceVideoTrack]);

  // ---- Socket listeners ----
  useEffect(() => {
    if (!socket || !myId) return;

    const onReceiveCall = (data: {
      signal: RTCSessionDescriptionInit;
      from: string;
      callerName: string;
      callerAvatar?: string;
      isVideo: boolean;
      conversationId?: string;
    }) => {
      if (!data?.from || data.from === myId) return;
      const current = stateRef.current;
      if (current.status === 'ringing' && current.incoming?.from === data.from) {
        return;
      }
      if (current.status === 'connected' && current.peerId === data.from) {
        // The same account may have more than one socket/tab. A duplicate
        // signal for the current peer is not a separate competing call and
        // must not make another tab tell the caller that this user is busy.
        return;
      }
      if (current.status === 'calling' && current.peerId === data.from) {
        if (myId < data.from) return;
        cleanup();
        peerIdRef.current = null;
      } else if (current.status === 'connected' || current.status === 'calling' || current.status === 'ringing') {
        socket.emit('callBusy', { to: data.from });
        return;
      }

      setState((prev) => {
        return {
          ...prev,
          status: 'ringing',
          incoming: {
            from: data.from,
            callerName: data.callerName || 'Người dùng',
            callerAvatar: data.callerAvatar,
            isVideo: data.isVideo,
            signal: data.signal,
            conversationId: data.conversationId,
          },
        };
      });
    };

    const onCallAccepted = async (payload: RTCSessionDescriptionInit | { signal: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      const signal = unwrapSessionDescription(payload);
      if (!pc) {
        if ((signal as { type?: string })?.type === 'livekit-accepted') {
          if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
          setState((prev) => ({ ...prev, status: 'connected' }));
        }
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        for (const c of pendingCandidates.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch { }
        }
        pendingCandidates.current = [];
        setState((prev) => ({ ...prev, status: 'connected' }));
      } catch (err) {
        console.error('[Call] setRemoteDescription(answer) failed', err);
      }
    };

    const onIceCandidate = async (payload: RTCIceCandidateInit | { candidate: RTCIceCandidateInit }) => {
      const candidate = unwrapIceCandidate(payload);
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingCandidates.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[Call] addIceCandidate failed', err);
      }
    };

    const onCallEnded = () => {
      cleanup();
      resetState();
    };

    const onCallRejected = () => {
      cleanup();
      setState((prev) => ({ ...prev, status: 'idle', error: 'Người nhận đã từ chối cuộc gọi.', localStream: null, remoteStream: null }));
    };

    const onCallBusy = () => {
      cleanup();
      setState((prev) => ({ ...prev, status: 'idle', error: 'Người nhận đang bận cuộc gọi khác.', localStream: null, remoteStream: null }));
    };

    const onCallUnavailable = () => {
      cleanup();
      setState((prev) => ({ ...prev, status: 'idle', error: 'Người nhận không online hoặc không nhận được cuộc gọi.', localStream: null, remoteStream: null }));
    };

    socket.on(`receiveCall-${myId}`, onReceiveCall);
    socket.on('receiveCall', onReceiveCall);
    socket.on(`callAccepted-${myId}`, onCallAccepted);
    socket.on(`iceCandidate-${myId}`, onIceCandidate);
    socket.on(`callEnded-${myId}`, onCallEnded);
    socket.on(`callRejected-${myId}`, onCallRejected);
    socket.on(`callBusy-${myId}`, onCallBusy);
    socket.on(`callUnavailable-${myId}`, onCallUnavailable);

    return () => {
      socket.off(`receiveCall-${myId}`, onReceiveCall);
      socket.off('receiveCall', onReceiveCall);
      socket.off(`callAccepted-${myId}`, onCallAccepted);
      socket.off(`iceCandidate-${myId}`, onIceCandidate);
      socket.off(`callEnded-${myId}`, onCallEnded);
      socket.off(`callRejected-${myId}`, onCallRejected);
      socket.off(`callBusy-${myId}`, onCallBusy);
      socket.off(`callUnavailable-${myId}`, onCallUnavailable);
    };
  }, [socket, myId, cleanup, resetState]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    ...state,
    startCall,
    startLiveKitCall,
    answerCall,
    answerLiveKitCall,
    endCall,
    rejectCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    refreshDevices,
    switchAudioInput,
    switchVideoInput,
  };
}
