import React from 'react';
import { X, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export const ForwardDialog = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col h-[500px]">
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <h3 className="font-semibold text-lg text-gray-900">Chuyển tiếp</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-3 border-b">
          <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm mọi người và nhóm" 
              className="bg-transparent border-none focus:outline-none text-sm w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Gần đây</h4>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <Avatar size="md" />
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-semibold text-gray-900 truncate">Nhóm Học Tập {i}</h4>
              </div>
              <button className="px-4 py-1.5 bg-blue-50 text-primary font-medium text-sm rounded-lg hover:bg-blue-100 transition-colors">
                Gửi
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
