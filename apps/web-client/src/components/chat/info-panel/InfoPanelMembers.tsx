import React from 'react';
import { InfoPanelAccordion } from './InfoPanelAccordion';
import { Avatar } from '@/components/ui/Avatar';
import { UserPlus } from 'lucide-react';

export const InfoPanelMembers = () => {
  return (
    <InfoPanelAccordion title="Thành viên trong đoạn chat">
      <div className="flex flex-col gap-1">
        <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left w-full">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-[14px] text-gray-700">Thêm người</span>
        </button>

        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
          <Avatar size="sm" />
          <div className="flex-1 overflow-hidden">
            <h4 className="text-[14px] font-medium text-gray-900 truncate">Nguyễn Văn A</h4>
            <p className="text-[12px] text-gray-500">Quản trị viên</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
          <Avatar size="sm" />
          <div className="flex-1 overflow-hidden">
            <h4 className="text-[14px] font-medium text-gray-900 truncate">Trần Thị B</h4>
          </div>
        </div>
      </div>
    </InfoPanelAccordion>
  );
};
