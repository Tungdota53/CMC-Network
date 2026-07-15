import React from 'react';
import { Avatar } from '@/components/ui/Avatar';

export const InfoPanelHeader = () => {
  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative mb-3">
        <Avatar size="xl" />
        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
      </div>
      <h2 className="text-lg font-bold text-gray-900">CMC AI Club</h2>
      <p className="text-sm text-gray-500 mt-1">Đang hoạt động</p>
    </div>
  );
};
