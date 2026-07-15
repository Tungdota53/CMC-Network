import React from 'react';
import { MoreHorizontal, Edit } from 'lucide-react';

interface Props {
  onCreateGroup?: () => void;
}

export const ConversationListHeader = ({ onCreateGroup }: Props) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">Đoạn chat</h2>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors" aria-label="Tùy chọn">
          <MoreHorizontal className="w-5 h-5" />
        </button>
        <button onClick={onCreateGroup} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors" aria-label="Tạo nhóm chat">
          <Edit className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
