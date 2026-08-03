'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { ClientAvatar } from '@/app/(main)/ClientAvatar';
import { Settings, HelpCircle, Moon, MessageSquareWarning, LogOut, ChevronRight, Medal, Sparkles, GraduationCap, ArrowLeft, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'main' | 'display'>('main');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const { theme, setTheme, compactMode, setCompactMode } = useUiStore();
  const router = useRouter();

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setTimeout(() => setActiveMenu('main'), 200);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    window.location.replace('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full focus:outline-none focus:ring-4 focus:ring-primary/20 transition-transform active:scale-95 group"
      >
        <div className={cn("p-0.5 rounded-full transition-colors", isOpen ? "bg-gradient-to-tr from-primary to-purple-500" : "bg-transparent group-hover:bg-primary/50")}>
          <ClientAvatar />
        </div>
      </button>

      {/* Dropdown Menu - Liquid Glass Theme */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[340px] rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50 isolate">
          {/* Bulletproof Glass Background Layer */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--card) 60%, transparent)',
              backdropFilter: 'blur(32px) saturate(200%)',
              WebkitBackdropFilter: 'blur(32px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)'
            }}
          />
          
          <div className="relative z-10 p-2">
            {activeMenu === 'main' ? (
              <>
                {/* Profile Summary Card */}
                <div className="relative overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 p-4 mb-2 group/card">
                  <div className="relative z-10 flex items-center gap-4 mb-3">
                  <ClientAvatar size="lg" className="border-2 border-background shadow-lg" />
                  <div className="flex-1">
                    <h3 className="font-bold text-[16px] text-foreground flex items-center gap-1.5">
                      {user?.fullName || 'Người dùng'}
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </h3>
                    <p className="text-[13px] text-foreground/60 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5" /> 
                      {user?.role === 'ADMIN' ? 'Quản trị viên' : 
                       user?.role === 'MODERATOR' ? 'Kiểm duyệt viên' : 
                       user?.role === 'LECTURER' ? 'Giảng viên' : 
                       (user?.studentId ? `SV - ${user.studentId}` : 'Sinh viên')}
                    </p>
                  </div>
                </div>
                
                {/* Gamification Stats */}
                <div className="flex items-center justify-between bg-white/50 dark:bg-black/20 rounded-lg p-2.5 mb-3 border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Medal className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <span className="text-[13px] font-semibold text-foreground/80">Danh tiếng</span>
                  </div>
                  <span className="text-[14px] font-black text-primary">
                    {new Intl.NumberFormat('en-US').format(user?.reputationScore || 0)} XP
                  </span>
                </div>

                <Link 
                  href="/profile" 
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-2 bg-primary text-white font-semibold text-[14px] hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                >
                  Vào trang cá nhân
                </Link>
              </div>

              {/* Menu Items */}
              <div className="space-y-0.5">
                <Link href="/settings" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                      <Settings className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-[14px] text-foreground">Cài đặt hệ thống</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground/80 transition-colors" />
                </Link>

                <div className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 group-hover:scale-110 transition-all">
                      <HelpCircle className="w-4.5 h-4.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="font-medium text-[14px] text-foreground">Trợ giúp & hỗ trợ</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground/80 transition-colors" />
                </div>

                <div onClick={() => setActiveMenu('display')} className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
                      <Moon className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium text-[14px] text-foreground">Giao diện (Sáng/Tối)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground/80 transition-colors" />
                </div>

                <div className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 group-hover:scale-110 transition-all shrink-0">
                    <MessageSquareWarning className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-[14px] text-foreground leading-tight">Góp ý phát triển</span>
                    <span className="text-[12px] text-foreground/50 mt-0.5">Giúp CMC Campus tốt hơn</span>
                  </div>
                </div>

                <div className="my-1 border-t border-black/5 dark:border-white/10"></div>

                <button onClick={handleLogout} className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-red-500/10 transition-all group cursor-pointer text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 group-hover:scale-110 transition-all">
                      <LogOut className="w-4.5 h-4.5 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="font-medium text-[14px] text-red-600 dark:text-red-400">Đăng xuất</span>
                  </div>
                </button>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border/50 text-[11px] text-foreground/40 text-center font-medium">
                CMC Campus © 2026 · Phát triển cho Sinh viên
              </div>
            </>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-3 mb-4 px-1">
                <button onClick={() => setActiveMenu('main')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors -ml-2">
                  <ArrowLeft className="w-5 h-5 text-foreground/80" />
                </button>
                <h2 className="font-bold text-[18px] text-foreground">Màn hình và trợ năng</h2>
              </div>

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {/* Dark Mode */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 px-1">
                    <div className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                      <Moon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[15px] text-foreground leading-tight">Chế độ tối</span>
                      <span className="text-[13px] text-foreground/60 mt-1 leading-snug">Điều chỉnh giao diện để giảm độ chói và cho đôi mắt được nghỉ ngơi.</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mt-2">
                    {[
                      { id: 'light', label: 'Tắt' },
                      { id: 'dark', label: 'Bật' },
                      { id: 'system', label: 'Tự động', desc: 'Chúng tôi sẽ tự động điều chỉnh màn hình theo cài đặt hệ thống trên thiết bị của bạn.' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTheme(option.id as 'light' | 'dark' | 'system')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-foreground/5 transition-colors text-left"
                      >
                        <div className="flex flex-col pr-4">
                          <span className="font-medium text-[15px] text-foreground">{option.label}</span>
                          {option.desc && <span className="text-[13px] text-foreground/60 mt-0.5 leading-snug">{option.desc}</span>}
                        </div>
                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", theme === option.id ? "border-blue-500" : "border-foreground/30")}>
                          {theme === option.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact Mode */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <div className="flex items-start gap-3 px-1">
                    <div className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                      <Type className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[15px] text-foreground leading-tight">Chế độ Thu gọn</span>
                      <span className="text-[13px] text-foreground/60 mt-1 leading-snug">Giảm kích thước phông chữ để có thêm nội dung vừa với màn hình.</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mt-2 pb-2">
                    {[
                      { id: false, label: 'Tắt' },
                      { id: true, label: 'Bật' }
                    ].map((option) => (
                      <button
                        key={String(option.id)}
                        onClick={() => setCompactMode(option.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-foreground/5 transition-colors text-left"
                      >
                        <span className="font-medium text-[15px] text-foreground">{option.label}</span>
                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", compactMode === option.id ? "border-blue-500" : "border-foreground/30")}>
                          {compactMode === option.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
