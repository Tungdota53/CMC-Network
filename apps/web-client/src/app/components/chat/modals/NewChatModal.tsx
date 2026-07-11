"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../lib/api';
import { User } from '../types';

interface NewChatModalProps {
  currentUser: User | null;
  onClose: () => void;
  onStartDirect: (user: User) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
}

interface SearchResult {
  users: Array<{ id: string; fullName: string; avatarUrl?: string | null; major?: string; cohort?: string }>;
}

export default function NewChatModal({
  currentUser,
  onClose,
  onStartDirect,
  onCreateGroup,
}: NewChatModalProps) {
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data: SearchResult = await res.json();
        const users = (data.users || [])
          .filter((u) => u.id !== currentUser?.id)
          .map((u) => ({
            id: u.id,
            fullName: u.fullName,
            avatarUrl: u.avatarUrl,
            major: u.major,
            cohort: u.cohort,
          }));
        setSearchResults(users);
      } catch {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, currentUser?.id]);

  const handleSelectUser = (user: User) => {
    if (activeTab === 'direct') {
      onStartDirect(user);
    } else {
      if (selectedUsers.find((u) => u.id === user.id)) {
        setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    onCreateGroup(groupName.trim(), selectedUsers.map((u) => u.id));
  };

  const isSelected = (id: string) => selectedUsers.some((u) => u.id === id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="w-[440px] max-w-[90vw] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Tin nhắn mới</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => { setActiveTab('direct'); setSelectedUsers([]); }}
              className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all ${activeTab === 'direct' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Chat mới
            </button>
            <button
              onClick={() => { setActiveTab('group'); setSelectedUsers([]); }}
              className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all ${activeTab === 'group' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tạo nhóm
            </button>
          </div>
        </div>

        {/* Group name input */}
        {activeTab === 'group' && (
          <div className="px-5 pt-4">
            <input
              type="text"
              placeholder="Tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-[14px] font-medium text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
        )}

        {/* Selected users chips (group mode) */}
        {activeTab === 'group' && selectedUsers.length > 0 && (
          <div className="px-5 pt-3 flex flex-wrap gap-2">
            {selectedUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-[13px] font-medium">
                {u.fullName}
                <button onClick={() => setSelectedUsers(selectedUsers.filter((s) => s.id !== u.id))} className="hover:text-indigo-900">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="p-5 pb-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-[14px] font-medium text-slate-800 placeholder-slate-400 outline-none border border-slate-200 focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${isSelected(user.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="relative">
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                      className="w-11 h-11 rounded-full object-cover"
                      alt=""
                    />
                    {isSelected(user.id) && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                        <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-slate-800 truncate">{user.fullName}</p>
                    {user.major && (
                      <p className="text-[12px] text-slate-400 truncate">{user.major}{user.cohort ? ` • ${user.cohort}` : ''}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
              <p className="text-[14px] font-medium text-slate-400">Không tìm thấy người dùng</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
              <p className="text-[14px] font-medium text-slate-400">Tìm kiếm để bắt đầu trò chuyện</p>
            </div>
          )}
        </div>

        {/* Footer (group mode) */}
        {activeTab === 'group' && (
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0}
              className="w-full py-3 bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:from-indigo-600 enabled:hover:to-violet-700 enabled:shadow-[0_4px_15px_rgba(79,70,229,0.3)]"
            >
              Tạo nhóm ({selectedUsers.length} thành viên)
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
