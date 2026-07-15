'use client';

import React from 'react';
import { MiniChatContainer } from '../mini-chat/MiniChatContainer';
import { ChatBubble } from '../notification/ChatBubble';
import { ChatNotificationPopup } from '../notification/ChatNotificationPopup';
import { ChatNotificationSound } from '../notification/ChatNotificationSound';

export const GlobalChat = () => {
  // Keep widget available everywhere; users expect the chat bubble even on Messenger.
  const hideMiniChat = false;

  return (
    <>
      {!hideMiniChat && <MiniChatContainer />}
      <ChatBubble />
      <ChatNotificationPopup />
      <ChatNotificationSound />
    </>
  );
};
