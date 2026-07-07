"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

type NavItem = {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  accent: string;
};

const Icons = {
  Home: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  ),
  Pulse: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l2.2-5 4.1 10 2.5-6H21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 5.5A9 9 0 103.7 16" />
    </svg>
  ),
  Groups: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  ),
  Store: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
    </svg>
  ),
  Bell: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
    </svg>
  ),
  Menu: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { path: '/', icon: Icons.Home, label: 'Trang chủ', accent: 'from-indigo-500 to-sky-500' },
    { path: '/pulse', icon: Icons.Pulse, label: 'Pulse', badge: 'Live', accent: 'from-sky-500 to-indigo-500' },
    { path: '/groups', icon: Icons.Groups, label: 'Nhóm', accent: 'from-violet-500 to-fuchsia-500' },
    { path: '/marketplace', icon: Icons.Store, label: 'Chợ', accent: 'from-emerald-500 to-teal-500' },
    { path: '/menu', icon: Icons.Menu, label: 'Menu', accent: 'from-slate-600 to-slate-400' },
  ];

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/86 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/78 dark:shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute inset-x-8 -top-10 h-20 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-400/20" />
        <div className="relative flex h-[72px] items-center justify-around px-2">
      {navItems.map((item) => {
        // Active state matching like Facebook
        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
        
        return (
          <Link 
            key={item.path} 
            href={item.path}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition-colors ${
              isActive ? 'text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="mobileNavPill"
                className={`absolute inset-x-1 top-2 bottom-2 rounded-2xl bg-gradient-to-br ${item.accent} shadow-lg shadow-indigo-500/25`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <motion.div 
              whileTap={{ scale: 0.86 }}
              className={`relative z-10 transition-transform duration-200 ${isActive ? '-translate-y-0.5 scale-105' : 'group-hover:-translate-y-0.5'}`}
            >
              {item.icon}
              {item.badge && (
                <span className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white dark:ring-slate-950">
                  {item.badge}
                </span>
              )}
            </motion.div>
            <span className={`relative z-10 text-[10px] font-semibold leading-none transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{item.label}</span>
          </Link>
        );
      })}
        </div>
      </div>
    </div>
  );
}
