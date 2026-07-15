import React from 'react';
import { X } from 'lucide-react';
import { InfoPanelHeader } from './InfoPanelHeader';
import { InfoPanelQuickActions } from './InfoPanelQuickActions';
import { InfoPanelAbout } from './InfoPanelAbout';
import { InfoPanelCustomize } from './InfoPanelCustomize';
import { InfoPanelMembers } from './InfoPanelMembers';
import { InfoPanelMediaGroup } from './InfoPanelMediaGroup';
import { InfoPanelPrivacy } from './InfoPanelPrivacy';

interface Props {
  onClose?: () => void;
}

export const InfoPanel = ({ onClose }: Props) => {
  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <div className="h-16 flex items-center justify-between px-4 border-b shrink-0 bg-white z-10 sticky top-0">
        <h3 className="font-semibold text-[17px]">Thông tin hội thoại</h3>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pb-6">
        <InfoPanelHeader />
        <InfoPanelQuickActions />
        
        <div className="px-2">
          <InfoPanelAbout />
          <InfoPanelCustomize />
          <InfoPanelMembers />
          <InfoPanelMediaGroup />
          <InfoPanelPrivacy />
        </div>
      </div>
    </div>
  );
};
