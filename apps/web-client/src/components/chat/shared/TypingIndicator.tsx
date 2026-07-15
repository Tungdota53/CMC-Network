import React from 'react';
import { Avatar } from '@/components/ui/Avatar';

export const TypingIndicator = () => {
  return (
    <div className="flex items-end gap-2 mb-2 w-full animate-in fade-in duration-300">
      <div className="w-8 shrink-0 flex items-end">
        <Avatar size="sm" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 w-fit">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};
