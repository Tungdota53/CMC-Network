import React from 'react';
import { MessageCircle } from 'lucide-react';

export const EmptyConversation = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <MessageCircle className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">CMC Campus Chat</h2>
      <p className="text-gray-500 max-w-sm">
        Chọn một cuộc trò chuyện từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới để kết nối với bạn bè.
      </p>
    </div>
  );
};
