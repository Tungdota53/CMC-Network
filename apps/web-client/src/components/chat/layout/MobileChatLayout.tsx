import React from 'react';

export const MobileChatLayout = ({ 
  children, 
  isConversationPage, 
  conversationList 
}: { 
  children: React.ReactNode;
  isConversationPage: boolean;
  conversationList: React.ReactNode;
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {isConversationPage ? (
        // When in a specific chat, show the chat area (children)
        <div className="flex-1 w-full h-full overflow-hidden flex flex-col relative">
          {children}
        </div>
      ) : (
        // When on /chat root, show the conversation list
        <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
          {conversationList}
        </div>
      )}
    </div>
  );
};
