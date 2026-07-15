'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, MessageCircle, User, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BottomNavBadgeMap = Partial<Record<'home' | 'study' | 'chat' | 'discover' | 'profile', number>>;

interface BottomNavProps {
  badges?: BottomNavBadgeMap;
  className?: string;
}

const tabs = [
  { id: 'home', href: '/feed', label: 'Home', icon: Home, match: ['/feed', '/notifications', '/search'] },
  { id: 'study', href: '/study', label: 'Study', icon: GraduationCap, match: ['/study', '/timetable', '/grades', '/materials'] },
  { id: 'chat', href: '/messages', label: 'Chat', icon: MessageCircle, match: ['/messages', '/chat'] },
  { id: 'discover', href: '/discover', label: 'Discover', icon: Compass, match: ['/discover', '/marketplace', '/events', '/clubs', '/professors', '/mentors'] },
  { id: 'profile', href: '/profile', label: 'Profile', icon: User, match: ['/profile', '/settings', '/reputation', '/saved'] },
] as const;

export function BottomNav({ badges = {}, className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính trên mobile"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[var(--mobile-z-bottom-nav)] border-t border-border bg-background/95 px-2 pb-[var(--mobile-safe-bottom)] pt-1.5 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden',
        className,
      )}
    >
      <ul className="mx-auto grid max-w-[var(--mobile-shell-max-width)] grid-cols-5 gap-1" role="list">
        {tabs.map((tab) => {
          const active = tab.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
          const Icon = tab.icon;
          const badge = badges[tab.id];
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-12 min-w-11 flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-semibold transition',
                  active ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:bg-hover hover:text-foreground',
                )}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">{tab.label}</span>
                {!!badge && badge > 0 && (
                  <span className="absolute right-3 top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white" aria-label={`${badge} mục chưa đọc`}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
