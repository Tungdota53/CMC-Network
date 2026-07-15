import React from 'react';
import { Swords, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const SubjectQuizCTA = () => {
  return (
    <div className="bg-gradient-to-b from-orange-50 to-orange-100 rounded-2xl border border-orange-200 overflow-hidden relative">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-200/50 rounded-full blur-xl" />
      <div className="p-6 relative z-10">
        <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
          <Swords className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Đấu trường môn này</h3>
        <p className="text-[14px] text-gray-600 mb-5">
          Bạn đã ôn tập kỹ? Tham gia đấu trường để so tài kiến thức môn Nhập môn lập trình với sinh viên khác!
        </p>
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-4 h-4 text-orange-500" />
          <span className="text-[13px] font-semibold text-orange-700">Phần thưởng: +50 Reputation</span>
        </div>
        <button className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20">
          Vào đấu trường <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
