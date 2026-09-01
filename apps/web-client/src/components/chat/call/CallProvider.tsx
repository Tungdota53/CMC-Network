'use client';

import React, { createContext, useContext } from 'react';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { useAuthStore } from '@/store/authStore';
import { IncomingCallModal } from './IncomingCallModal';
import { LiveKitDirectCall } from './LiveKitDirectCall';

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
  const user = useAuthStore((state) => state.user);
  const call = useWebRTCCall(
    socket,
    user?.id,
    (user as any)?.fullName,
    (user as any)?.avatarUrl,
  );

  return (
    <CallContext.Provider value={{ startCall: call.startLiveKitCall, status: call.status, error: call.error }}>
      {children}

      {call.error && (
        <div role="alert" aria-live="assertive" className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[120] mx-auto max-w-sm rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-xl sm:left-auto sm:mx-0">
          {call.error}
        </div>
      )}

      {call.status === 'ringing' && call.incoming && (
        <IncomingCallModal
          callerName={call.incoming.callerName}
          callerAvatar={call.incoming.callerAvatar}
          isVideo={call.incoming.isVideo}
          onAccept={call.answerLiveKitCall}
          onReject={call.rejectCall}
        />
      )}

      {(call.status === 'calling' || call.status === 'connected') && call.peerId && !call.conversationId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-gray-950 px-6 text-white">
          <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-4 text-sm backdrop-blur-xl">
            Đang tạo phòng LiveKit…
          </div>
        </div>
      )}

      {(call.status === 'calling' || call.status === 'connected') && call.peerId && call.conversationId && (
        <LiveKitDirectCall
          conversationId={call.conversationId}
          title={call.peerName || 'Cuộc gọi'}
          avatarUrl={call.peerAvatar}
          isVideo={call.isVideo}
          onClose={call.endCall}
        />
      )}
    </CallContext.Provider>
  );
};
