import React from 'react';
import { MonitorUp } from 'lucide-react';

interface Props {
  presenterName: string;
}

export const CallScreenShareView = ({ presenterName }: Props) => {
  return (
    <div className="w-full h-full bg-black relative group">
      {/* Fake Screen Share Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-80 border-2 border-blue-500/30">
        <MonitorUp className="w-16 h-16 text-blue-500 mb-4 opacity-50" />
        <p className="text-xl font-bold text-gray-300">[{presenterName} đang chia sẻ màn hình]</p>
      </div>
      
      {/* Banner info */}
      <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        {presenterName} đang trình bày
      </div>
    </div>
  );
};
