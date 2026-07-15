import React from 'react';
import { MicOff } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface Props {
  name: string;
  isMuted?: boolean;
  isActiveSpeaker?: boolean;
  isVideoOff?: boolean;
}

export const CallParticipantVideo = ({ name, isMuted, isActiveSpeaker, isVideoOff }: Props) => {
  return (
    <div className={`relative w-full h-full bg-gray-800 rounded-2xl overflow-hidden shadow-lg border-2 ${isActiveSpeaker ? 'border-green-500' : 'border-transparent'} transition-colors`}>
      {isVideoOff ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar size="xl" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-30 bg-black">
          [Video Stream]
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
        <span className="text-white text-[13px] font-medium">{name}</span>
        {isMuted && <MicOff className="w-3.5 h-3.5 text-red-500" />}
      </div>
    </div>
  );
};
