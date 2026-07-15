'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function MessagesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background">
      <div className="w-24 h-24 rounded-full bg-hover flex items-center justify-center mb-6 border-4 border-card shadow-sm">
        <MessageCircle className="w-12 h-12 text-foreground/40" />
      </div>
      <h2 className="text-[22px] font-bold text-foreground mb-2">Chưa chọn đoạn chat nào</h2>
      <p className="text-[15px] text-foreground/60 max-w-md text-center">
        Chọn một cuộc trò chuyện từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới để kết nối với mọi người.
      </p>
    </div>
  );
}
