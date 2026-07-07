"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from '../components/UserMenu';
import AuthGuard from '../components/AuthGuard';
import SidebarProfile from '../components/SidebarProfile';
import RightSidebar from '../components/RightSidebar';
import ChatWidget from '../components/ChatWidget';
import MessagesDropdown from '../components/MessagesDropdown';
import MobileBottomNav from '../components/MobileBottomNav';
import NotificationsDropdown from '../components/NotificationsDropdown';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import { UserProvider } from '../contexts/UserContext';
import { SocketProvider } from '../contexts/SocketContext';
import { Toaster } from 'react-hot-toast';

// ==================== PREMIUM LINE ICONS ====================
const Icons = {
  Home: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  Pulse: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l2.2-5 4.1 10 2.5-6H21"/><path strokeLinecap="round" strokeLinejoin="round" d="M20 5.5A9 9 0 103.7 16"/></svg>,
  Users: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  Book: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  Calendar: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Store: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>,
  AI: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  Search: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  Bell: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  Bookmark: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>,
  Trophy: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-5-16h10v3a5 5 0 01-10 0V5zm10 1h2a2 2 0 010 4h-.5M7 6H5a2 2 0 000 4h.5"/></svg>,
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActivePath = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <AuthGuard>
      <UserProvider>
        <SocketProvider>
        {/* TOP NAVBAR - PREMIUM GLASSMORPHISM */}
        <nav className="fixed top-0 left-0 right-0 h-16 glass-panel z-50 flex items-center justify-between px-3 sm:px-6 transition-all duration-300 supports-[backdrop-filter]:bg-white/72 dark:supports-[backdrop-filter]:bg-slate-950/64">
        
        {/* Logo & Search */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:shadow-indigo-500/30 transition-all duration-300 border border-white/10 bg-zinc-900">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src="/logo.png" alt="CMC Network" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <span className="text-[22px] font-black hidden md:block tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-indigo-400 drop-shadow-md">
              CMC NetWork
            </span>
          </Link>
          
          
          <div className="hidden sm:block"><GlobalSearch /></div>
        </div>

        {/* Center Navigation */}
        <div className="hidden lg:flex items-center gap-1 h-full absolute left-1/2 -translate-x-1/2">
          {[
            { icon: Icons.Home, path: '/', label: 'Feed' },
            { icon: Icons.Pulse, path: '/pulse', label: 'Pulse' },
            { icon: Icons.Users, path: '/groups', label: 'Nhóm' },
            { icon: Icons.Book, path: '/materials', label: 'Tài liệu' },
            { icon: Icons.Store, path: '/marketplace', label: 'Chợ' },
          ].map((item, i) => {
            const active = isActivePath(item.path);

            return (
            <Link 
              key={i} 
              href={item.path}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`px-5 h-14 flex items-center justify-center rounded-2xl transition-all relative group ${
                active
                  ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-500/10'
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="group-hover:-translate-y-0.5 transition-transform duration-300">{item.icon}</div>
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] bg-indigo-600 dark:bg-indigo-300 rounded-t-full transition-all duration-300 ${active ? 'w-10 opacity-100' : 'w-0 opacity-0 group-hover:w-10 group-hover:opacity-100'}`}></div>
            </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button aria-label="Tìm kiếm" className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#3A3B3C] text-slate-800 dark:text-slate-200 transition-colors active:scale-95">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </button>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <MessagesDropdown />
          <div className="hidden sm:block">
            <NotificationsDropdown />
          </div>
          <div className="hidden sm:block pl-2 border-l border-slate-200 dark:border-slate-700">
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      <main className="pt-16 lg:pt-24 pb-20 lg:pb-10 max-w-[1600px] mx-auto flex justify-center w-full min-h-screen px-0 sm:px-4 gap-6">
        
        {/* LEFT SIDEBAR */}
        <div className="hidden xl:block w-[300px] shrink-0 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar pb-6">
          <div className="glass p-5 flex flex-col gap-2 mb-5">
            <SidebarProfile />
          </div>
          
          <div className="glass p-3 flex flex-col gap-1 mb-5">
            {[
              { icon: Icons.Pulse, label: 'Live Campus Pulse', color: 'text-sky-500', path: '/pulse' },
              { icon: Icons.Users, label: 'Nhóm học tập', color: 'text-indigo-500', path: '/groups' },
              { icon: Icons.Book, label: 'Kho tài liệu', color: 'text-violet-500', path: '/materials' },
              { icon: Icons.Calendar, label: 'Sự kiện', color: 'text-rose-500', path: '/events' },
              { icon: Icons.Store, label: 'Chợ sinh viên', color: 'text-emerald-500', path: '/marketplace' },
              { icon: Icons.Trophy, label: 'Bảng xếp hạng', color: 'text-amber-500', path: '/leaderboard' },
              { icon: Icons.Bookmark, label: 'Đã lưu', color: 'text-orange-500', path: '/saved' },
            ].map((item, i) => (
              <Link href={item.path} key={i} aria-current={isActivePath(item.path) ? 'page' : undefined} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group ${isActivePath(item.path) ? 'bg-indigo-50/90 dark:bg-indigo-500/10' : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80'}`}>
                <div className={`transition-transform duration-300 ${item.color} group-hover:scale-110`}>{item.icon}</div>
                <span className="font-medium text-token-secondary group-hover:text-token-primary text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
          
          <div className="glass p-4">
             <h4 className="text-token-tertiary font-semibold text-xs uppercase tracking-wider mb-4 pl-2">Thành tựu (Reputation)</h4>
             <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3 p-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-default group">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 text-lg group-hover:scale-105 transition-transform dark:bg-amber-900/30 dark:border-amber-700">🏆</div>
                  <div>
                    <div className="text-sm font-medium text-token-primary">Sinh Viên Xuất Sắc</div>
                    <div className="text-xs text-amber-600 mt-0.5">1,250 Điểm</div>
                  </div>
               </div>
               <div className="flex items-center gap-3 p-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-default group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 text-lg group-hover:scale-105 transition-transform dark:bg-indigo-900/30 dark:border-indigo-700">💎</div>
                  <div>
                    <div className="text-sm font-medium text-token-primary">Chuyên Gia React</div>
                    <div className="text-xs text-indigo-600 mt-0.5">Top 5%</div>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* CENTER FEED */}
        <div className="w-full max-w-[640px] shrink-0 pb-10">
          {children}
        </div>

        {/* RIGHT SIDEBAR */}
        <RightSidebar />
        
        <ChatWidget />
        <MobileBottomNav />
        <Toaster 
          position="bottom-left"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(16px)',
              color: '#0f172a',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }
          }}
        />
      </main>
        </SocketProvider>
      </UserProvider>
    </AuthGuard>
  );
}
