"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Conversation, User } from '../types';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface InfoPanelProps {
  selectedConversation: Conversation;
  getAvatar: (id: string, avatarUrl?: string | null) => string;
}

export default function InfoPanel({
  selectedConversation,
  getAvatar,
}: InfoPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'customize': false,
    'members': true,
    'media': false,
    'privacy': false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="w-[340px] flex-shrink-0 border-l border-white/50 bg-white/40 flex flex-col h-full overflow-y-auto custom-scrollbar relative z-20">
      <div className="p-6 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <img src={getAvatar(selectedConversation.id, selectedConversation.avatarUrl)} className="w-20 h-20 rounded-full object-cover shadow-md border-4 border-white" alt="" />
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">{selectedConversation.title}</h3>
        <p className="text-[13px] font-semibold text-slate-500 mt-1">Đang hoạt động</p>
        
        <div className="flex items-center gap-6 mt-6">
          <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => toast('Đã tắt thông báo!', { icon: '🔕' })}>
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-slate-100 transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <span className="text-[12px] font-medium text-slate-500">Tắt TB</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => toast('Đang tìm kiếm...', { icon: '🔍' })}>
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-slate-100 transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <span className="text-[12px] font-medium text-slate-500">Tìm kiếm</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-2 pb-4 space-y-1">
        {/* Tùy chỉnh */}
        <div>
          <button onClick={() => toggleSection('customize')} className="w-full flex items-center justify-between p-3 hover:bg-white/60 rounded-xl transition-colors text-left group">
            <span className="font-semibold text-[14px] text-slate-700">Tùy chỉnh đoạn chat</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${openSections['customize'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <AnimatePresence>
            {openSections['customize'] && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="py-1 px-2 space-y-1">
                  <button className="w-full flex items-center gap-3 p-2 hover:bg-white/60 rounded-lg transition-colors text-[14px] font-medium text-slate-600" onClick={() => toast('Tính năng đổi màu đang Beta!', { icon: '🎨' })}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600"></div>
                    Đổi chủ đề
                  </button>
                  <button className="w-full flex items-center gap-3 p-2 hover:bg-white/60 rounded-lg transition-colors text-[14px] font-medium text-slate-600">
                    <span className="w-7 h-7 flex items-center justify-center text-xl">👍</span>
                    Thay đổi biểu tượng cảm xúc
                  </button>
                  <button className="w-full flex items-center gap-3 p-2 hover:bg-white/60 rounded-lg transition-colors text-[14px] font-medium text-slate-600" onClick={() => toast('Tính năng đổi biệt danh đang Beta!')}>
                    <div className="w-7 h-7 flex items-center justify-center text-slate-400">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </div>
                    Chỉnh sửa biệt danh
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Thành viên */}
        <div>
          <button onClick={() => toggleSection('members')} className="w-full flex items-center justify-between p-3 hover:bg-white/60 rounded-xl transition-colors text-left group">
            <span className="font-semibold text-[14px] text-slate-700">Thành viên trong đoạn chat</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${openSections['members'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <AnimatePresence>
            {openSections['members'] && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="py-2 px-3 space-y-3">
                  {selectedConversation.otherMembers.map((member) => (
                    <div key={member.userId} className="flex items-center gap-3">
                      <img src={getAvatar(member.userId, member.user.avatarUrl)} className="w-9 h-9 rounded-full object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] text-slate-800 truncate">{member.user.fullName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Media */}
        <div>
          <button onClick={() => toggleSection('media')} className="w-full flex items-center justify-between p-3 hover:bg-white/60 rounded-xl transition-colors text-left group">
            <span className="font-semibold text-[14px] text-slate-700">File phương tiện, file và liên kết</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${openSections['media'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <AnimatePresence>
            {openSections['media'] && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="py-2 px-3">
                  <p className="text-sm font-medium text-slate-400 text-center py-4">Chưa có file phương tiện nào được chia sẻ.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Quyền riêng tư */}
        <div>
          <button onClick={() => toggleSection('privacy')} className="w-full flex items-center justify-between p-3 hover:bg-white/60 rounded-xl transition-colors text-left group">
            <span className="font-semibold text-[14px] text-slate-700">Quyền riêng tư và hỗ trợ</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${openSections['privacy'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <AnimatePresence>
            {openSections['privacy'] && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="py-1 px-2 space-y-1">
                  <button className="w-full flex items-center gap-3 p-2 hover:bg-white/60 rounded-lg transition-colors text-[14px] font-medium text-slate-600">
                    <div className="w-7 h-7 flex items-center justify-center text-slate-400">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    Trạng thái bảo mật
                  </button>
                  <button className="w-full flex items-center gap-3 p-2 hover:bg-red-50 rounded-lg transition-colors text-[14px] font-medium text-red-600">
                    <div className="w-7 h-7 flex items-center justify-center">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
                    </div>
                    Chặn tin nhắn
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
