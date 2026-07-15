'use client';

import React from 'react';
import { Phone, Video, Info } from 'lucide-react';

export const ChatHeaderActions = () => {
  return (
    <div className="flex items-center gap-2">
      <button 
        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        aria-label="Bắt đầu cuộc gọi thoại"
      >
        <Phone className="w-5 h-5 fill-current" />
      </button>
      
      <button 
        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        aria-label="Bắt đầu cuộc gọi video"
      >
        <Video className="w-5 h-5 fill-current" />
      </button>

      <button 
        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        aria-label="Thông tin cuộc trò chuyện"
      >
        <Info className="w-5 h-5 fill-current" />
      </button>
    </div>
  );
};
