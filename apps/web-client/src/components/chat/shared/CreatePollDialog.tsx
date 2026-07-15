import React from 'react';
import { X, Plus } from 'lucide-react';

export const CreatePollDialog = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <h3 className="font-semibold text-lg text-gray-900">Tạo cuộc thăm dò ý kiến</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Câu hỏi</label>
            <input type="text" placeholder="Đặt câu hỏi..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Các lựa chọn</label>
            <div className="space-y-2">
              <input type="text" placeholder="Lựa chọn 1" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              <input type="text" placeholder="Lựa chọn 2" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              <button className="flex items-center gap-2 text-primary font-medium text-sm hover:bg-blue-50 px-3 py-2 rounded-lg w-full transition-colors">
                <Plus className="w-4 h-4" />
                Thêm lựa chọn
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" defaultChecked />
              <span className="text-sm text-gray-700">Cho phép chọn nhiều phương án</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
              <span className="text-sm text-gray-700">Cho phép mọi người thêm lựa chọn</span>
            </label>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            Hủy
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors">
            Tạo
          </button>
        </div>
      </div>
    </div>
  );
};
