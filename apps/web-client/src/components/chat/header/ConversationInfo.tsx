import React from 'react';
import { X, Search, Bell, FileText, Image as ImageIcon, Link2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface Props {
  onClose?: () => void;
}

export const ConversationInfo = ({ onClose }: Props) => {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="h-16 flex items-center justify-between px-4 border-b shrink-0">
        <h3 className="font-semibold text-[17px]">Thông tin hội thoại</h3>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center py-6 border-b">
          <Avatar size="xl" className="mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Nguyễn Văn A</h2>
          <p className="text-sm text-gray-500">Đang hoạt động</p>
        </div>

        <div className="flex justify-center gap-6 py-4 border-b">
          <button className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Search className="w-5 h-5 text-gray-900" />
            </div>
            <span className="text-[12px] font-medium text-gray-700">Tìm kiếm</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-gray-900" />
            </div>
            <span className="text-[12px] font-medium text-gray-700">Tắt TB</span>
          </button>
        </div>

        <div className="py-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            <ImageIcon className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-[15px]">File phương tiện</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            <FileText className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-[15px]">File đính kèm</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            <Link2 className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-[15px]">Liên kết</span>
          </button>
        </div>
      </div>
    </div>
  );
};
