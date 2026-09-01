'use client';

import React from 'react';
import { MiniChatWindow } from './MiniChatWindow';
import { useChatStore } from '@/store/chatStore';

export const MiniChatContainer = () => {
  const { windows, closeChat, toggleMinimize } = useChatStore();

  if (windows.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-4 z-50 hidden max-w-[calc(100vw-2rem)] items-end gap-3 overflow-hidden pointer-events-none md:flex xl:right-20">
      {/* Minimized windows stack as chat heads */}
      {windows.some(w => w.isMinimized) && (
        <div className="flex flex-col-reverse gap-3 pb-4 pointer-events-auto">
          {windows.filter(w => w.isMinimized).map(w => (
            <MiniChatWindow 
              key={w.id} 
              conversationId={w.id} 
              name={w.name} 
              avatarUrl={w.avatarUrl}
              isOnline={w.isOnline}
              isMinimized={true} 
              onClose={() => closeChat(w.id)}
              onToggleMinimize={() => toggleMinimize(w.id)}
            />
          ))}
        </div>
      )}

      {/* Open windows */}
      {windows.filter(w => !w.isMinimized).slice(-2).map(w => (
        <div key={w.id} className="pointer-events-auto">
          <MiniChatWindow 
            conversationId={w.id} 
            name={w.name} 
            avatarUrl={w.avatarUrl}
            isOnline={w.isOnline}
            isMinimized={false} 
            onClose={() => closeChat(w.id)}
            onToggleMinimize={() => toggleMinimize(w.id)}
          />
        </div>
      ))}
    </div>
  );
};
