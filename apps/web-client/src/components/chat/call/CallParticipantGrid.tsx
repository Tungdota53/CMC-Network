import React from 'react';
import { CallParticipantVideo } from './CallParticipantVideo';

interface Participant {
  id: string;
  name: string;
  isMuted?: boolean;
  isActiveSpeaker?: boolean;
  isVideoOff?: boolean;
}

interface CallParticipantGridProps {
  participants?: Participant[];
}

export const CallParticipantGrid = ({ participants = [] }: CallParticipantGridProps) => {
  const count = participants.length;
  
  if (count === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-foreground/50 text-sm">
        Đang chờ người tham gia...
      </div>
    );
  }

  // Calculate grid layout based on number of participants
  let gridClass = 'grid-cols-2 grid-rows-2'; // Default for 3-4
  if (count <= 2) gridClass = 'grid-cols-1 md:grid-cols-2 grid-rows-1';
  else if (count >= 5) gridClass = 'grid-cols-3 grid-rows-2'; // up to 6, can extend

  return (
    <div className={`absolute inset-0 p-4 md:p-8 grid gap-4 ${gridClass} h-full`}>
      {participants.map((p) => (
        <div key={p.id} className="w-full h-full min-h-[200px]">
          <CallParticipantVideo {...p} />
        </div>
      ))}
    </div>
  );
};
