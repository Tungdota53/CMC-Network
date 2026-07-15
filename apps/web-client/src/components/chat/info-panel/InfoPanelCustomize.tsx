import React from 'react';
import { InfoPanelAccordion } from './InfoPanelAccordion';
import { Palette, Smile, Type } from 'lucide-react';

export const InfoPanelCustomize = () => {
  return (
    <InfoPanelAccordion title="Tùy chỉnh đoạn chat">
      <div className="flex flex-col">
        <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
            <Palette className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[14px] text-gray-700">Đổi chủ đề</span>
        </button>
        <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Smile className="w-3.5 h-3.5 text-gray-600" />
          </div>
          <span className="text-[14px] text-gray-700">Thay đổi biểu tượng cảm xúc</span>
        </button>
        <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Type className="w-3.5 h-3.5 text-gray-600" />
          </div>
          <span className="text-[14px] text-gray-700">Chỉnh sửa biệt danh</span>
        </button>
      </div>
    </InfoPanelAccordion>
  );
};
