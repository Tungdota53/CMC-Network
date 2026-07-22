'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, User, Bell, MessageCircle, Settings, Search, Users, BookOpen, Library, Bot, GraduationCap, Calendar, Star, LineChart, ShoppingBag, Ticket, Flag, Shield, UserCircle, Bookmark } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { RightSidebar } from '@/components/sidebar-right/RightSidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { GlobalSearchInput } from '@/components/navigation/GlobalSearchInput';
import { GlobalChat } from '@/components/chat/shared/GlobalChat';
import { CallProvider } from '@/components/chat/call/CallProvider';
import { ProfileDropdown } from '@/components/navigation/ProfileDropdown';
import { MessageDropdown } from '@/components/navigation/MessageDropdown';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { BottomNav } from '@/components/mobile';

import { CMCLogo } from '@/components/CMCLogo';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isProfilePage = pathname.startsWith('/profile');
  const isMessagesPage = pathname.startsWith('/messages');
  const isFriendsPage = pathname.startsWith('/friends');
  const isFeedPage = pathname === '/' || pathname.startsWith('/feed');

  return (
    <CallProvider>
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-clip">
      {/* Ambient Background Blobs for Glassmorphism */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none -z-10"></div>
      
      {/* Header / Navbar - Apple Liquid Glass Style */}
      <header className="h-14 sticky top-0 z-50 flex items-center justify-between px-4">
        {/* Glass Background - Placed as absolute child so it doesn't trap dropdown blurs */}
        <div className="absolute inset-0 bg-card/70 backdrop-blur-md border-b border-border/60 shadow-sm z-[-1]"></div>
        
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-2 flex-1 lg:flex-none xl:w-[360px]">
          <Link href="/feed" className="flex items-center shrink-0 group mr-2">
            <img src="/new-logo-transparent.png" alt="CMC Network Logo" className="h-10 w-auto object-contain drop-shadow-md transition-transform group-hover:scale-105" />
          </Link>
          <div className="hidden sm:block">
            <GlobalSearchInput />
          </div>
        </div>

        {/* Center: Navigation (Desktop) */}
        <div className="hidden md:grid grid-cols-5 items-center justify-items-center h-full flex-1 max-w-[650px] gap-2 px-4">
          <Link href="/feed" className="group flex w-full min-w-0 items-center justify-center h-full relative px-2">
            {isFeedPage && (
              <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-t-full shadow-[0_-2px_12px_rgba(14,165,233,0.6)]" />
            )}
            <div className={cn("w-full h-[46px] rounded-xl flex items-center justify-center transition-all duration-300 ease-out", isFeedPage ? "" : "hover:bg-white/5")}>
              <Home
                className={cn("w-[28px] h-[28px] transition-all duration-300 ease-out group-hover:scale-110", isFeedPage ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110" : "text-slate-400 group-hover:text-slate-200")}
                fill={isFeedPage ? "currentColor" : "none"}
                strokeWidth={isFeedPage ? 2.5 : 2}
              />
            </div>
          </Link>
          <Link href="/friends" className="group flex w-full min-w-0 items-center justify-center h-full relative px-2">
            {isFriendsPage && (
              <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-t-full shadow-[0_-2px_12px_rgba(14,165,233,0.6)]" />
            )}
            <div className={cn("w-full h-[46px] rounded-xl flex items-center justify-center transition-all duration-300 ease-out", isFriendsPage ? "" : "hover:bg-white/5")}>
              <Users
                className={cn("w-[28px] h-[28px] transition-all duration-300 ease-out group-hover:scale-110", isFriendsPage ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110" : "text-slate-400 group-hover:text-slate-200")}
                fill={isFriendsPage ? "currentColor" : "none"}
                strokeWidth={isFriendsPage ? 2.5 : 2}
              />
            </div>
          </Link>
          <Link href="/study" className="group flex w-full min-w-0 items-center justify-center h-full relative px-2">
            {pathname.startsWith('/study') && (
              <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-t-full shadow-[0_-2px_12px_rgba(14,165,233,0.6)]" />
            )}
            <div className={cn("w-full h-[46px] rounded-xl flex items-center justify-center transition-all duration-300 ease-out", pathname.startsWith('/study') ? "" : "hover:bg-white/5")}>
              <BookOpen 
                className={cn("w-[28px] h-[28px] transition-all duration-300 ease-out group-hover:scale-110", pathname.startsWith('/study') ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110" : "text-slate-400 group-hover:text-slate-200")} 
                fill={pathname.startsWith('/study') ? "currentColor" : "none"}
                strokeWidth={pathname.startsWith('/study') ? 2.5 : 2}
              />
            </div>
          </Link>
          <Link href="/groups" className="group flex w-full min-w-0 items-center justify-center h-full relative px-2">
            {pathname.startsWith('/groups') && (
              <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-t-full shadow-[0_-2px_12px_rgba(14,165,233,0.6)]" />
            )}
            <div className={cn("w-full h-[46px] rounded-xl flex items-center justify-center transition-all duration-300 ease-out", pathname.startsWith('/groups') ? "" : "hover:bg-white/5")}>
              <svg 
                viewBox="0 0 24 24" 
                fill={pathname.startsWith('/groups') ? "currentColor" : "none"} 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={cn("w-[28px] h-[28px] transition-all duration-300 ease-out group-hover:scale-110", pathname.startsWith('/groups') ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110 stroke-[2.5]" : "text-slate-400 group-hover:text-slate-200 stroke-2")}
              >
                <path d="M12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                <path d="M17.5 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
                <path d="M6.5 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
                <path d="M22 21c0-2-2.5-3.5-5.5-3.5v3.5Z" />
                <path d="M2 21c0-2 2.5-3.5 5.5-3.5v3.5Z" />
                <path d="M6.5 21C6.5 18 9 15.5 12 15.5s5.5 2.5 5.5 5.5Z" />
              </svg>
            </div>
          </Link>
          <Link href="/marketplace" className="group flex w-full min-w-0 items-center justify-center h-full relative px-2">
            {pathname.startsWith('/marketplace') && (
              <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-t-full shadow-[0_-2px_12px_rgba(14,165,233,0.6)]" />
            )}
            <div className={cn("w-full h-[46px] rounded-xl flex items-center justify-center transition-all duration-300 ease-out", pathname.startsWith('/marketplace') ? "" : "hover:bg-white/5")}>
              <ShoppingBag 
                className={cn("w-[28px] h-[28px] transition-all duration-300 ease-out group-hover:scale-110", pathname.startsWith('/marketplace') ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110" : "text-slate-400 group-hover:text-slate-200")} 
                fill={pathname.startsWith('/marketplace') ? "currentColor" : "none"}
                strokeWidth={pathname.startsWith('/marketplace') ? 2.5 : 2}
              />
            </div>
          </Link>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center justify-end gap-2 lg:w-[320px] xl:w-[360px]">
          {/* Menu Icon (Optional - like Facebook grid menu) */}
          <button className="hidden sm:flex w-10 h-10 rounded-full bg-hover hover:bg-foreground/10 transition-colors items-center justify-center text-foreground shrink-0">
            <svg viewBox="0 0 44 44" width="20" height="20" fill="currentColor">
              <circle cx="7" cy="7" r="6"></circle><circle cx="22" cy="7" r="6"></circle><circle cx="37" cy="7" r="6"></circle>
              <circle cx="7" cy="22" r="6"></circle><circle cx="22" cy="22" r="6"></circle><circle cx="37" cy="22" r="6"></circle>
              <circle cx="7" cy="37" r="6"></circle><circle cx="22" cy="37" r="6"></circle><circle cx="37" cy="37" r="6"></circle>
            </svg>
          </button>
          
          <MessageDropdown />
          <NotificationBell />
          <ProfileDropdown />
        </div>
      </header>

      {/* Main Content Area */}
      <div className={cn("flex-1 flex w-full mx-auto justify-between", (!isMessagesPage && !isFriendsPage) && "max-w-[1600px]", isFriendsPage && "w-full max-w-none")}>
        
        {!isProfilePage && !isMessagesPage && !isFriendsPage && (
          <aside className="w-[280px] hidden lg:block p-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20">
            <nav className="space-y-1">

            {/* --- Học Tập & Hỗ Trợ --- */}
            <Link href="/timetable" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Lịch học thông minh</span>
            </Link>
            <Link href="/grades" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <LineChart className="w-6 h-6 text-emerald-500" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Theo dõi GPA</span>
            </Link>
            <Link href="/study" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-orange-500" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Góc Học Tập (Nhóm)</span>
            </Link>
            <Link href="/materials" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Library className="w-6 h-6 text-purple-500" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Kho Tài Liệu & AI</span>
            </Link>
            <Link href="/ai" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Trợ Lý AI</span>
            </Link>
            <Link href="/professors" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Review Giảng viên</span>
            </Link>
            <Link href="/mentors" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-indigo-500" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Mentor Connect</span>
            </Link>

            <div className="border-t border-border/50 my-2"></div>
            {/* --- Đời Sống & Cộng Đồng --- */}

            <Link href="/marketplace" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-cyan-500" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Chợ sinh viên</span>
            </Link>
            <Link href="/events" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-pink-500" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Sự kiện</span>
            </Link>
            <Link href="/clubs" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
                <Flag className="w-6 h-6 text-red-500" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">CLB & Cộng đồng</span>
            </Link>
            <Link href="/reputation" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors">
              <div className="w-9 h-9 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-semibold text-[15px] text-foreground">Uy tín & Danh hiệu</span>
            </Link>

            </nav>
          </aside>
        )}

        <main className={cn(
          "flex-1 w-full mx-auto", 
          isMessagesPage ? "max-w-none p-0 h-[calc(100vh-3.5rem)] overflow-hidden" : 
          isFriendsPage ? "max-w-none p-0" :
          isProfilePage ? "max-w-[1090px] py-6 px-4" : 
          isFeedPage ? "max-w-[960px] py-6 px-4 max-md:pb-[calc(var(--mobile-bottom-nav-height)+var(--mobile-safe-bottom)+1rem)]" : "max-w-[1400px] py-6 px-4 max-md:pb-[calc(var(--mobile-bottom-nav-height)+var(--mobile-safe-bottom)+1rem)]"
        )}>
          {children}
        </main>

        {/* Right Sidebar */}
        {isFeedPage && (
          <aside className="w-[280px] hidden xl:block sticky top-14 h-[calc(100vh-3.5rem)]">
            <RightSidebar />
          </aside>
        )}
      </div>
      {!isMessagesPage && <BottomNav />}
      <GlobalChat />
    </div>
    </CallProvider>
  );
}
