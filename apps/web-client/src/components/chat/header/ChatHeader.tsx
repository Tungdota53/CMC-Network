import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { ChatHeaderActions } from './ChatHeaderActions';

export const ChatHeader = () => {
  return (
    <div className="h-16 w-full border-b bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-10 relative">
      {/* Left side: Avatar and Name */}
      <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 -ml-1.5 rounded-lg transition-colors">
        <div className="relative">
          <Avatar size="md" />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-gray-900 leading-tight">Nguyễn Văn A</h2>
          <p className="text-xs text-gray-500">Đang hoạt động</p>
        </div>
      </div>

      {/* Right side: Actions */}
      <ChatHeaderActions />
    </div>
  );
};
