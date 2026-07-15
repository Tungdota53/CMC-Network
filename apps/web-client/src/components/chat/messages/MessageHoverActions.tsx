import React from 'react';
import { Smile, Reply, MoreVertical } from 'lucide-react';

export const MessageHoverActions = ({ isMe }: { isMe: boolean }) => {
  return (
    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity ${isMe ? 'right-[100%] pr-2' : 'left-[100%] pl-2'}`}>
      <button className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center transition-colors">
        <Smile className="w-4 h-4" />
      </button>
      <button className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center transition-colors">
        <Reply className="w-4 h-4" />
      </button>
      <button className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
};
