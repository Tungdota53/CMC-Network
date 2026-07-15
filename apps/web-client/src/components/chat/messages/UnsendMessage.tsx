import React from 'react';

export const UnsendMessage = ({ isMe }: { isMe: boolean }) => {
  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`px-4 py-2 my-0.5 max-w-[70%] border rounded-2xl bg-white text-gray-400 italic text-[15px]`}>
        Tin nhắn đã bị thu hồi
      </div>
    </div>
  );
};
