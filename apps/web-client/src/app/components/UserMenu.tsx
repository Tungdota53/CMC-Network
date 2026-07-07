"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-500/50 transition-colors cursor-pointer ring-2 ring-transparent focus:ring-indigo-500/30 relative z-10"
      >
        <img src={user?.avatarUrl || "https://i.pravatar.cc/150?img=11"} alt="Avatar" className="w-full h-full object-cover" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 glass rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right z-50">
          
          {/* Header Info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 surface-subtle flex items-center gap-3">
            <img src={user?.avatarUrl || "https://i.pravatar.cc/150?img=11"} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
            <div className="flex flex-col">
               <span className="text-token-primary font-semibold text-[14px] leading-tight truncate w-[150px]">{user?.fullName || 'Khách'}</span>
               {user?.studentId && (
                 <span className="text-indigo-600 dark:text-indigo-400 text-[12px] font-medium mt-0.5">@{user.studentId}</span>
               )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-1 surface">
            <Link 
              href="/profile/me" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-token-secondary hover:text-token-primary transition-colors cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">👤</span> <span className="text-sm font-medium">Trang cá nhân</span>
            </Link>
            
            <Link 
              href="/settings" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-token-secondary hover:text-token-primary transition-colors cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">⚙️</span> <span className="text-sm font-medium">Cài đặt & Quyền riêng tư</span>
            </Link>
            
            <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-token-secondary hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer text-left group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">🚪</span> <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
