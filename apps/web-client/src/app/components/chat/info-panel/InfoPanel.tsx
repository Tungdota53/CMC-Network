"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Conversation, Message } from '../types';
import { useState, useMemo } from 'react';

interface InfoPanelProps {
  selectedConversation: Conversation;
  getAvatar: (id: string, avatarUrl?: string | null) => string;
  onlineUsers: string[];
  messages?: Message[];
  onUpdateBackground?: (url: string) => void;
}

export default function InfoPanel({
  selectedConversation,
  getAvatar,
  onlineUsers,
  messages = [],
  onUpdateBackground,
}: InfoPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    customize: false,
    members: true,
    media: false,
    files: false,
    privacy: false,
  });
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'videos' | 'files'>('images');
  const [uploadingBg, setUploadingBg] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Extract shared media from messages
  const sharedMedia = useMemo(() => {
    const images: Message[] = [];
    const videos: Message[] = [];
    const files: Message[] = [];

    messages.forEach((msg) => {
      if (msg.messageType === 'image' && msg.mediaUrl) images.push(msg);
      else if (msg.messageType === 'video' && msg.mediaUrl) videos.push(msg);
      else if (msg.messageType === 'file' && msg.mediaUrl) files.push(msg);
    });

    return { images, videos, files };
  }, [messages]);

  const isGroupChat = selectedConversation.type === 'GROUP';
  const otherUserId = selectedConversation.otherMembers[0]?.userId || '';
  const isOtherOnline = onlineUsers.includes(otherUserId);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateBackground) return;
    try {
      setUploadingBg(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        onUpdateBackground(data.url);
      }
    } finally {
      setUploadingBg(false);
    }
  };

  return (
    <div className="w-[340px] flex-shrink-0 bg-white flex flex-col h-full overflow-y-auto custom-scrollbar relative z-20">
      {/* Profile section */}
      <div className="p-6 flex flex-col items-center text-center border-b border-slate-100">
        <div className="relative mb-3">
          <img
            src={getAvatar(selectedConversation.id, selectedConversation.avatarUrl)}
            className="w-20 h-20 rounded-full object-cover shadow-lg ring-4 ring-white"
            alt=""
          />
          {!isGroupChat && (
            <span className={`absolute bottom-1 right-1 w-4 h-4 border-[3px] border-white rounded-full ${isOtherOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-800">{selectedConversation.title}</h3>
        <p className="text-[12px] font-medium text-slate-400 mt-0.5">
          {isGroupChat
            ? `${selectedConversation.otherMembers.length + 1} thành viên`
            : isOtherOnline
              ? 'Đang hoạt động'
              : 'Ngoại tuyến'}
        </p>

        {/* Quick actions */}
        <div className="flex items-center gap-5 mt-5">
          {[
            { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, label: 'Tắt TB' },
            { icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>, label: 'Tìm kiếm' },
          ].map((action, i) => (
            <div key={i} className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                {action.icon}
              </div>
              <span className="text-[11px] font-medium text-slate-400">{action.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-2 pb-4 space-y-0.5 pt-2">
        {/* Tùy chỉnh */}
        <SectionAccordion
          title="Tùy chỉnh đoạn chat"
          isOpen={openSections.customize}
          onToggle={() => toggleSection('customize')}
        >
          <div className="py-1 px-1 space-y-0.5">
            <label className={`w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-[13px] font-medium ${uploadingBg ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 cursor-pointer'}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 shrink-0 flex items-center justify-center text-white">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              {uploadingBg ? 'Đang tải...' : 'Đổi ảnh nền'}
              <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} disabled={uploadingBg} />
            </label>
            <button className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-[13px] font-medium text-slate-600">
              <span className="w-8 h-8 flex items-center justify-center text-xl shrink-0">👍</span>
              Thay đổi biểu tượng cảm xúc
            </button>
            <button className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-[13px] font-medium text-slate-600">
              <div className="w-8 h-8 flex items-center justify-center text-slate-400 shrink-0">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              Chỉnh sửa biệt danh
            </button>
          </div>
        </SectionAccordion>

        {/* Thành viên */}
        <SectionAccordion
          title={`Thành viên${isGroupChat ? ` (${selectedConversation.otherMembers.length + 1})` : ''}`}
          isOpen={openSections.members}
          onToggle={() => toggleSection('members')}
        >
          <div className="py-1 px-1 space-y-1">
            {selectedConversation.otherMembers.map((member) => {
              const isMemberOnline = onlineUsers.includes(member.userId);
              return (
                <div key={member.userId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="relative shrink-0">
                    <img src={getAvatar(member.userId, member.user.avatarUrl)} className="w-9 h-9 rounded-full object-cover" alt="" />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${isMemberOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-slate-700 truncate">{member.user.fullName}</p>
                    <p className={`text-[11px] font-medium ${isMemberOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {isMemberOnline ? 'Hoạt động' : 'Ngoại tuyến'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionAccordion>

        {/* Shared Media Gallery */}
        <SectionAccordion
          title="Media, file và liên kết"
          isOpen={openSections.media}
          onToggle={() => toggleSection('media')}
        >
          <div className="py-2 px-1">
            {/* Media sub-tabs */}
            <div className="flex gap-1 mb-3">
              {([
                { key: 'images' as const, label: 'Ảnh', count: sharedMedia.images.length },
                { key: 'videos' as const, label: 'Video', count: sharedMedia.videos.length },
                { key: 'files' as const, label: 'File', count: sharedMedia.files.length },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveMediaTab(tab.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    activeMediaTab === tab.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Image grid */}
            {activeMediaTab === 'images' && (
              sharedMedia.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {sharedMedia.images.map((msg) => (
                    <a key={msg.id} href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                      <img src={msg.mediaUrl} className="w-full h-full object-cover" alt="" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] font-medium text-slate-400 text-center py-6">Chưa có ảnh được chia sẻ</p>
              )
            )}

            {/* Video list */}
            {activeMediaTab === 'videos' && (
              sharedMedia.videos.length > 0 ? (
                <div className="space-y-2">
                  {sharedMedia.videos.map((msg) => (
                    <video key={msg.id} src={msg.mediaUrl} controls className="w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <p className="text-[12px] font-medium text-slate-400 text-center py-6">Chưa có video được chia sẻ</p>
              )
            )}

            {/* Files list */}
            {activeMediaTab === 'files' && (
              sharedMedia.files.length > 0 ? (
                <div className="space-y-1.5">
                  {sharedMedia.files.map((msg) => (
                    <a
                      key={msg.id}
                      href={msg.mediaUrl}
                      download
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-700 truncate">{msg.content || 'Tệp tin'}</p>
                        <p className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] font-medium text-slate-400 text-center py-6">Chưa có file được chia sẻ</p>
              )
            )}
          </div>
        </SectionAccordion>

        {/* Quyền riêng tư */}
        <SectionAccordion
          title="Quyền riêng tư"
          isOpen={openSections.privacy}
          onToggle={() => toggleSection('privacy')}
        >
          <div className="py-1 px-1 space-y-0.5">
            <button className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-[13px] font-medium text-slate-600">
              <div className="w-8 h-8 flex items-center justify-center text-slate-400 shrink-0">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              Trạng thái bảo mật
            </button>
            <button className="w-full flex items-center gap-3 p-2.5 hover:bg-red-50 rounded-xl transition-colors text-[13px] font-medium text-red-500">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
              </div>
              Chặn tin nhắn
            </button>
          </div>
        </SectionAccordion>
      </div>
    </div>
  );
}

/* ─── Reusable Accordion Section ─── */
function SectionAccordion({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
      >
        <span className="font-semibold text-[13px] text-slate-700">{title}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
