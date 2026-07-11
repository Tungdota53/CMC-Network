"use client";

import { motion } from 'framer-motion';

interface EmptyConversationProps {
  onNewChat: () => void;
}

export default function EmptyConversation({ onNewChat }: EmptyConversationProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="flex-1 flex flex-col items-center justify-center bg-transparent text-slate-500 p-8 text-center relative z-10 overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-100/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-100/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #4f46e5 1px, transparent 0)', backgroundSize: '28px 28px' }} />

      <motion.div 
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="w-36 h-36 mb-8 relative flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/40 to-violet-200/30 rounded-full animate-ping opacity-60"></div>
        <div className="absolute inset-2 bg-gradient-to-br from-indigo-100/50 to-violet-100/40 rounded-full blur-md"></div>
        <div className="relative w-28 h-28 bg-gradient-to-br from-white to-indigo-50/50 rounded-3xl flex items-center justify-center shadow-2xl border border-white/80">
          <span className="text-6xl drop-shadow-md">✨</span>
        </div>
      </motion.div>
      <h3 className="text-[30px] font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-indigo-800 to-violet-800 tracking-tight">Chào mừng đến với Messenger</h3>
      <p className="text-[16px] mt-3 font-medium text-slate-500 max-w-sm leading-relaxed">Chọn một đoạn chat từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới để kết nối với mọi người.</p>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-8 px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-full shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.4)] transition-all"
        onClick={onNewChat}
      >
        Khám phá ngay →
      </motion.button>
    </motion.div>
  );
}
