import React from 'react';
import { Mic, Video } from 'lucide-react';

export const CallMissedActions = () => {
  return (
    <div className="flex gap-2 mt-2">
      <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-[14px] font-medium text-gray-900">
        <Mic className="w-4 h-4 text-gray-600" />
        Nhắn tin thoại
      </button>
      <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-[14px] font-medium text-gray-900">
        <Video className="w-4 h-4 text-gray-600" />
        Nhắn video
      </button>
    </div>
  );
};
