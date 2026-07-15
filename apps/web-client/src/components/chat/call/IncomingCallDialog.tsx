'use client';

import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface Props {
  callerName: string;
  isVideo: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallDialog = ({ callerName, isVideo, onAccept, onDecline }: Props) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900/95 text-white animate-in fade-in duration-300">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75"></div>
        <Avatar size="xl" className="relative z-10 w-32 h-32 text-4xl" />
      </div>
      
      <h2 className="text-3xl font-bold mb-2">{callerName}</h2>
      <p className="text-gray-400 mb-12">Đang gọi {isVideo ? 'video' : 'thoại'} cho bạn...</p>
      
      <div className="flex items-center gap-16">
        <button 
          onClick={onDecline}
          className="flex flex-col items-center gap-3 group"
        >
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-red-500/20">
            <PhoneOff className="w-8 h-8 text-white" />
          </div>
          <span className="font-medium text-red-400">Từ chối</span>
        </button>

        <button 
          onClick={onAccept}
          className="flex flex-col items-center gap-3 group"
        >
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20 animate-bounce">
            {isVideo ? <Video className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-white" />}
          </div>
          <span className="font-medium text-green-400">Trả lời</span>
        </button>
      </div>

      {/* Hidden audio element for ringtone */}
      <audio src="/sounds/ringtone.mp3" autoPlay loop className="hidden" />
    </div>
  );
};
