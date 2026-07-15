import React from 'react';
import { InfoPanelAccordion } from './InfoPanelAccordion';
import { Ban, AlertTriangle, LogOut } from 'lucide-react';

export const InfoPanelPrivacy = () => {
  return (
    <InfoPanelAccordion title="Quyền riêng tư và hỗ trợ">
      <div className="flex flex-col">
        <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Ban className="w-3.5 h-3.5 text-gray-900" />
          </div>
          <span className="text-[14px] text-gray-900">Chặn</span>
        </button>
        <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-gray-900" />
          </div>
          <span className="text-[14px] text-gray-900">Báo cáo</span>
        </button>
        <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left group">
          <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
            <LogOut className="w-3.5 h-3.5 text-red-600" />
          </div>
          <span className="text-[14px] text-red-600 font-medium">Rời khỏi nhóm</span>
        </button>
      </div>
    </InfoPanelAccordion>
  );
};
