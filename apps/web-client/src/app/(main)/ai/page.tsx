import React from 'react';
import { AiChatWindow } from '@/components/ai/AiChatWindow';
import { Bot } from 'lucide-react';

export default function AiPage() {
  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 h-[calc(100vh-3.5rem)] flex flex-col px-4">
      <div className="mb-4">
        <h1 className="text-[28px] font-bold text-gray-900 mb-1 flex items-center gap-3"><Bot className="w-8 h-8 text-primary" /> Trợ lý AI CMC Network</h1>
        <p className="text-gray-500">Hỏi về học tập, đời sống sinh viên, CMC Network và thông tin chính thức từ Trường Đại học CMC.</p>
      </div>
      <AiChatWindow />
    </div>
  );
}
