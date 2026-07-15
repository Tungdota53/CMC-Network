import React from 'react';
import { Settings, Video, Mic, Volume2 } from 'lucide-react';

export const CallSettingsMenu = ({ onClose }: { onClose?: () => void }) => {
  return (
    <div className="absolute bottom-24 right-4 w-64 bg-gray-900 text-white border border-gray-700 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-5">
      <div className="p-2 border-b border-gray-800 flex justify-between items-center">
        <h4 className="font-semibold text-[15px]">Cài đặt thiết bị</h4>
        {onClose && <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>}
      </div>
      
      <div className="py-2 space-y-1">
        <button className="w-full flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg transition-colors text-left group">
          <div className="flex items-center gap-3">
            <Video className="w-4 h-4 text-gray-400 group-hover:text-white" />
            <span className="text-[14px]">Chất lượng HD</span>
          </div>
          <div className="w-8 h-4 bg-blue-500 rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg transition-colors text-left group">
          <div className="flex items-center gap-3">
            <Mic className="w-4 h-4 text-gray-400 group-hover:text-white" />
            <span className="text-[14px]">Giảm tiếng ồn</span>
          </div>
          <div className="w-8 h-4 bg-blue-500 rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </button>
        
        <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors text-left group">
          <Settings className="w-4 h-4 text-gray-400 group-hover:text-white" />
          <span className="text-[14px]">Cài đặt âm thanh và video...</span>
        </button>
      </div>
    </div>
  );
};
