import React from 'react';
import { CallParticipantVideo } from './CallParticipantVideo';
import { CallScreenShareView } from './CallScreenShareView';

export const CallPresentationLayout = () => {
  return (
    <div className="absolute inset-0 flex flex-col md:flex-row bg-gray-900 p-4 gap-4">
      <div className="flex-1 rounded-2xl overflow-hidden relative">
        <CallScreenShareView presenterName="Minh An" />
      </div>
      
      {/* Filmstrip (Right on Desktop, Bottom on Mobile) */}
      <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto shrink-0 md:w-64 pb-2 md:pb-0">
        <div className="w-32 h-24 md:w-full md:h-40 shrink-0">
          <CallParticipantVideo name="Phương Anh" />
        </div>
        <div className="w-32 h-24 md:w-full md:h-40 shrink-0">
          <CallParticipantVideo name="Quốc Huy" />
        </div>
        <div className="w-32 h-24 md:w-full md:h-40 shrink-0">
          <CallParticipantVideo name="Tôi" isMuted />
        </div>
      </div>
    </div>
  );
};
