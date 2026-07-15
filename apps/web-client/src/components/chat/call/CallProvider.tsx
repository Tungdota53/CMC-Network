'use client';

import React, { createContext, useContext } from 'react';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { useAuthStore } from '@/store/authStore';
import { CallOverlay } from './CallOverlay';
import { IncomingCallModal } from './IncomingCallModal';

type StartCall = (
  peerId: string,
  peerName: string,
  isVideo: boolean,
  peerAvatar?: string | null,
  conversationId?: string,
) => void;

interface CallContextValue {
  startCall: StartCall;
  status: string;
  error: string | null;
}

const CallContext = createContext<CallContextValue>({
  startCall: () => {},
  status: 'idle',
  error: null,
});

export const useCall = () => useContext(CallContext);

/**
 * CallProvider — single source of truth for the WebRTC call.
 * Mounts ONE useWebRTCCall instance (shared socket) so incoming calls are
 * handled once and rendered globally. Exposes startCall via context.
 */
export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket } = useChatSocket();
  const { user } = useAuthStore();
  const call = useWebRTCCall(
    socket,
    user?.id,
    (user as any)?.fullName,
    (user as any)?.avatarUrl,
  );

  return (
    <CallContext.Provider value={{ startCall: call.startCall, status: call.status, error: call.error }}>
      {children}

      {call.error && (
        <div className="fixed bottom-6 right-6 z-[120] max-w-sm rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-xl">
          {call.error}
        </div>
      )}

      {call.status === 'ringing' && call.incoming && (
        <IncomingCallModal
          callerName={call.incoming.callerName}
          callerAvatar={call.incoming.callerAvatar}
          isVideo={call.incoming.isVideo}
          onAccept={call.answerCall}
          onReject={call.rejectCall}
        />
      )}

      {(call.status === 'calling' || call.status === 'connected') && (
        <CallOverlay
          name={call.peerName || 'Cuộc gọi'}
          avatarUrl={call.peerAvatar}
          isVideo={call.isVideo}
          status={call.status}
          localStream={call.localStream}
          remoteStream={call.remoteStream}
          isMuted={call.isMuted}
          isVideoOff={call.isVideoOff}
          isScreenSharing={call.isScreenSharing}
          connectionQuality={call.connectionQuality}
          devices={call.devices}
          selectedAudioInputId={call.selectedAudioInputId}
          selectedVideoInputId={call.selectedVideoInputId}
          onToggleMute={call.toggleMute}
          onToggleVideo={call.toggleVideo}
          onToggleScreenShare={call.toggleScreenShare}
          onRefreshDevices={call.refreshDevices}
          onSwitchAudioInput={call.switchAudioInput}
          onSwitchVideoInput={call.switchVideoInput}
          onEndCall={call.endCall}
        />
      )}
    </CallContext.Provider>
  );
};
