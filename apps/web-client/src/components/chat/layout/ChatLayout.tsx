'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChatSidebar } from './ChatSidebar';
import { ConversationList } from '../conversations/ConversationList';
import { InfoPanel } from '../info-panel/InfoPanel';
import { MobileChatLayout } from './MobileChatLayout';

export const ChatLayout = ({ children }: { children: React.ReactNode }) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On Mobile, if we are inside a conversation (/chat/[id]), we only show the chat area.
  // If we are at /chat, we only show the ConversationList.
  const isConversationPage = pathname !== '/chat';

  if (isMobile) {
    return (
      <MobileChatLayout 
        isConversationPage={isConversationPage}
        conversationList={<ConversationList />}
      >
        {children}
      </MobileChatLayout>
    );
  }

  return (
    <div 
      className={`w-full h-full grid transition-all duration-300 ease-in-out ${
        isInfoOpen ? 'grid-cols-[80px_360px_1fr_320px]' : 'grid-cols-[80px_360px_1fr]'
      }`}
    >
      {/* 1. Global Icon Sidebar */}
      <div className="border-r border-gray-200 bg-white hidden sm:block h-full">
        <ChatSidebar />
      </div>

      {/* 2. Conversation List */}
      <div className="border-r border-gray-200 bg-white h-full flex flex-col">
        <ConversationList />
      </div>

      {/* 3. Main Chat Area */}
      <div className="bg-white h-full relative flex flex-col">
        {/* We can pass down the toggle Info panel function using Context in a real app, 
            but for now we can just leave it as is or use a global store later */}
        {children}
      </div>

      {/* 4. Info Panel (Optional) */}
      {isInfoOpen && (
        <div className="border-l border-gray-200 bg-white h-full overflow-y-auto">
          <InfoPanel onClose={() => setIsInfoOpen(false)} />
        </div>
      )}
    </div>
  );
};
