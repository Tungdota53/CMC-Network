import React from 'react';
import { Search, Bell, UserPlus } from 'lucide-react';

export const InfoPanelQuickActions = () => {
  return (
    <div className="flex justify-center gap-6 pb-6">
      <button className="flex flex-col items-center gap-1 group">
        <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
          <Search className="w-5 h-5 text-gray-800" />
        </div>
        <span className="text-[12px] font-medium text-gray-600">Tìm kiếm</span>
      </button>
      
      <button className="flex flex-col items-center gap-1 group">
        <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
          <Bell className="w-5 h-5 text-gray-800" />
        </div>
        <span className="text-[12px] font-medium text-gray-600">Tắt TB</span>
      </button>

      <button className="flex flex-col items-center gap-1 group">
        <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
          <UserPlus className="w-5 h-5 text-gray-800" />
        </div>
        <span className="text-[12px] font-medium text-gray-600">Thêm</span>
      </button>
    </div>
  );
};
