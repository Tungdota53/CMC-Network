"use client";

import { motion } from 'framer-motion';

export default function EmptyConversation() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="flex-1 flex flex-col items-center justify-center bg-transparent text-slate-500 p-8 text-center relative z-10"
    >
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="w-32 h-32 mb-8 relative flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-50"></div>
        <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-indigo-50">
          <span className="text-5xl drop-shadow-md">✨</span>
        </div>
      </motion.div>
      <h3 className="text-[28px] font-black text-slate-800 tracking-tight">Chào mừng đến với Messenger</h3>
      <p className="text-[16px] mt-3 font-medium text-slate-500 max-w-sm leading-relaxed">Chọn một đoạn chat từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới để kết nối với mọi người.</p>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-8 px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.15)] transition-colors"
      >
        Khám phá ngay
      </motion.button>
    </motion.div>
  );
}
