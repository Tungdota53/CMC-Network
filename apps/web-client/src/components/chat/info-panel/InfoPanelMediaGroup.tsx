import React from 'react';
import { InfoPanelAccordion } from './InfoPanelAccordion';
import { FileText, Image as ImageIcon, Link2 } from 'lucide-react';

export const InfoPanelMediaGroup = () => {
  return (
    <InfoPanelAccordion title="File PT, file và liên kết">
      <div className="flex flex-col gap-1">
        <button className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-medium text-[14px] text-gray-700">File phương tiện</span>
        </button>
        <button className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-medium text-[14px] text-gray-700">File đính kèm</span>
        </button>
        <button className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-medium text-[14px] text-gray-700">Liên kết</span>
        </button>
      </div>
    </InfoPanelAccordion>
  );
};
