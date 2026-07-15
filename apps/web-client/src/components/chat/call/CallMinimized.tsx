'use client';

import React from 'react';
import { Maximize2, MicOff, PhoneOff } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CallTimer } from './CallTimer';

export const CallMinimized = ({ onExpand }: { onExpand: () => void }) => {
  return (
    <div className="fixed top-24 right-6 w-48 bg-gray-900 text-white rounded-2xl shadow-xl overflow-hidden cursor-move border border-gray-700 z-50">
      <div className="p-3 flex items-center gap-3 bg-gray-800">
        <Avatar size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate">Minh An</p>
          <div className="text-[11px] text-gray-400"><CallTimer /></div>
        </div>
      </div>
      
      <div className="flex items-center justify-between p-2 bg-gray-900">
        <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <MicOff className="w-4 h-4 text-gray-400" />
        </button>
        <button className="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition-colors">
          <PhoneOff className="w-4 h-4" />
        </button>
        <button onClick={onExpand} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <Maximize2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};
