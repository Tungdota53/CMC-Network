import React from 'react';
import Link from 'next/link';
import { Home, User, Bell, Settings, MessageCircle, Archive } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export const ChatSidebar = () => {
  return (
    <div className="w-full h-full flex flex-col items-center py-4 space-y-6">
      <Link href="/profile" title="Trang cá nhân">
        <Avatar size="sm" className="cursor-pointer" />
      </Link>
      
      <div className="flex-1 flex flex-col items-center space-y-4">
        <Link href="/messages" className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary" title="Đoạn chat">
          <MessageCircle className="w-6 h-6 fill-current" />
        </Link>
        
        <Link href="/friends" className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors" title="Bạn bè">
          <User className="w-6 h-6" />
        </Link>

        <Link href="/messages" className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors" title="Lưu trữ">
          <Archive className="w-6 h-6" />
        </Link>
      </div>

      <div className="flex flex-col items-center space-y-4 pb-4">
        <Link href="/settings" className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors" title="Cài đặt">
          <Settings className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
};
