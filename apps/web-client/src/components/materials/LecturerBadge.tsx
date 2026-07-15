import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const LecturerBadge = () => {
  return (
    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-md" title="Được tải lên bởi Giảng viên">
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>Giảng viên</span>
    </div>
  );
};
