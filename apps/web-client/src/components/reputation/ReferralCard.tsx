'use client';
import React, { useState } from 'react';
import { Share2, Copy, Check, Link as LinkIcon, Gift } from 'lucide-react';

interface ReferralCardProps {
  referralCode: string;
  totalReferred: number;
  xpEarned: number;
}

export const ReferralCard = ({ referralCode, totalReferred, xpEarned }: ReferralCardProps) => {
  const [copied, setCopied] = useState(false);
  const shareLink = `https://cmc-campus.edu.vn/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-400/20 rounded-full blur-xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg">Mời bạn bè, nhận ngay 50 XP</h3>
            <p className="text-sm text-indigo-100 font-medium">Bạn và người được mời đều nhận điểm thưởng!</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="flex-1 bg-black/20 rounded-xl p-3 flex items-center gap-3 border border-white/10">
            <LinkIcon className="w-4 h-4 text-indigo-200 shrink-0" />
            <span className="font-mono text-sm text-indigo-100 truncate select-all">
              {shareLink}
            </span>
          </div>
          <button 
            onClick={copyToClipboard}
            className="px-4 bg-white text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã copy' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-xs text-indigo-200 mb-1 font-medium">Đã giới thiệu</p>
            <p className="text-2xl font-black">{totalReferred} <span className="text-sm font-semibold opacity-70">người</span></p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-xs text-indigo-200 mb-1 font-medium">XP kiếm được</p>
            <p className="text-2xl font-black text-amber-300">+{xpEarned} <span className="text-sm font-semibold opacity-70 text-white">XP</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
