import React from 'react';
import { InfoPanelAccordion } from './InfoPanelAccordion';

export const InfoPanelAbout = () => {
  return (
    <InfoPanelAccordion title="Thông tin về đoạn chat">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">Xem thành viên</p>
        <p className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">Đổi tên nhóm</p>
      </div>
    </InfoPanelAccordion>
  );
};
