"use client";

import Link from 'next/link';
import { useUser } from '../../contexts/UserContext';
import { useEffect, useState } from 'react';

const Icons = {
  Users: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  Book: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  Calendar: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Store: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>,
  Trophy: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-5-16h10v3a5 5 0 01-10 0V5zm10 1h2a2 2 0 010 4h-.5M7 6H5a2 2 0 000 4h.5"/></svg>,
  Bookmark: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>,
  Settings: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Logout: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  AI: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  Moon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  Sun: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
};

export default function MobileMenu() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMounted(true);
      setIsDark(document.documentElement.classList.contains('dark'));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    if (next) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  };

  const menuItems = [
    { icon: Icons.Users, label: 'Nhóm học tập', path: '/groups', color: 'text-indigo-500' },
    { icon: Icons.Book, label: 'Kho tài liệu', path: '/materials', color: 'text-violet-500' },
    { icon: Icons.Calendar, label: 'Sự kiện', path: '/events', color: 'text-rose-500' },
    { icon: Icons.Store, label: 'Chợ sinh viên', path: '/marketplace', color: 'text-emerald-500' },
    { icon: Icons.Trophy, label: 'Bảng xếp hạng', path: '/leaderboard', color: 'text-amber-500' },
    { icon: Icons.Bookmark, label: 'Đã lưu', path: '/saved', color: 'text-orange-500' },
    { icon: Icons.AI, label: 'AI Tutor', path: '/ai', color: 'text-blue-500' },
  ];

  return (
    <div className="w-full bg-[#f0f2f5] dark:bg-[#18191A] min-h-screen pt-4 px-4 pb-24 lg:hidden">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Menu</h1>
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 cursor-pointer transition-transform active:scale-95">
          {Icons.Settings}
        </div>
      </div>

      {/* Profile Card */}
      <Link href="/profile/me" className="flex items-center gap-3 bg-white dark:bg-[#242526] p-4 rounded-2xl shadow-sm mb-4 cursor-pointer active:scale-95 transition-transform border border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
          <img src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.id || 'me'}`} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 dark:text-white text-[16px] truncate">{user?.fullName || 'Người dùng'}</div>
          <div className="text-slate-500 dark:text-slate-400 text-[14px]">Xem trang cá nhân của bạn</div>
        </div>
      </Link>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {menuItems.map((item, i) => (
          <Link key={i} href={item.path} className="bg-white dark:bg-[#242526] p-4 rounded-2xl shadow-sm flex flex-col gap-3 active:scale-95 transition-transform border border-slate-200 dark:border-slate-800">
            <span className={item.color}>{item.icon}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[14px]">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Utilities */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm mb-6 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200 font-semibold text-[15px]">
            <span className="text-slate-500 dark:text-slate-400">
              {mounted && isDark ? Icons.Moon : Icons.Sun}
            </span>
            Chế độ tối
          </div>
          {mounted && (
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          )}
        </button>
      </div>

      <button className="w-full bg-slate-200 dark:bg-[#3A3B3C] hover:bg-slate-300 dark:hover:bg-[#4A4B4C] text-slate-800 dark:text-white font-semibold py-3 rounded-2xl transition-colors mb-4 flex items-center justify-center gap-2">
        {Icons.Logout} Đăng xuất
      </button>
    </div>
  );
}
