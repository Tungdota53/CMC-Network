import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MoreVertical } from 'lucide-react';

interface Props {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  onOpenSettings: () => void;
}

export const CallControls = ({
  isMuted, isVideoOff, isScreenSharing,
  onToggleMute, onToggleVideo, onToggleScreenShare,
  onEndCall, onOpenSettings
}: Props) => {
  return (
    <div className="absolute bottom-4 left-1/2 flex max-w-[94vw] -translate-x-1/2 items-center gap-2 rounded-full bg-gray-950/85 px-3 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-10 fade-in duration-300 md:bottom-8 md:gap-4 md:px-6 md:py-4">
      
      <button 
        onClick={onToggleMute}
        title={isMuted ? 'Bật micro' : 'Tắt micro'}
        aria-label={isMuted ? 'Bật micro' : 'Tắt micro'}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors md:h-12 md:w-12 ${
          isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      <button 
        onClick={onToggleVideo}
        title={isVideoOff ? 'Bật camera' : 'Tắt camera'}
        aria-label={isVideoOff ? 'Bật camera' : 'Tắt camera'}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors md:h-12 md:w-12 ${
          isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
      </button>

      <button 
        onClick={onToggleScreenShare}
        title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
        aria-label={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors md:h-12 md:w-12 ${
          isScreenSharing ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' : 'bg-white/10 text-white hover:bg-white/20'
        } hidden md:flex`}
      >
        <MonitorUp className="w-6 h-6" />
      </button>

      <div className="mx-1 h-8 w-px bg-white/20 md:mx-2"></div>

      <button 
        onClick={onEndCall}
        title="Kết thúc cuộc gọi"
        aria-label="Kết thúc cuộc gọi"
        className="flex h-13 w-13 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/20 transition-colors hover:bg-red-600 md:h-14 md:w-14"
      >
        <PhoneOff className="w-6 h-6 text-white" />
      </button>

      <div className="mx-1 h-8 w-px bg-white/20 md:mx-2"></div>

      <button 
        onClick={onOpenSettings}
        title="Cài đặt cuộc gọi"
        aria-label="Cài đặt cuộc gọi"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:h-12 md:w-12"
      >
        <MoreVertical className="w-6 h-6" />
      </button>

    </div>
  );
};
