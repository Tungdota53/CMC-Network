import React from 'react';

export const MessageTimestamp = ({ date, isMe }: { date: string; isMe: boolean }) => {
  const formattedTime = new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`text-[11px] text-gray-400 mt-0.5 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
      {formattedTime}
    </div>
  );
};
