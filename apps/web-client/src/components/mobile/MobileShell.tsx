'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MobileTopBar, type MobileTopBarProps } from './MobileTopBar';
import { BottomNav } from './BottomNav';

type MobileShellVariant = 'list' | 'detail' | 'fullscreen';

interface MobileShellProps extends Omit<MobileTopBarProps, 'className'> {
  children: React.ReactNode;
  showTopBar?: boolean;
  showBottomNav?: boolean;
  variant?: MobileShellVariant;
  className?: string;
  contentClassName?: string;
}

const variantClasses: Record<MobileShellVariant, string> = {
  list: 'px-4 py-3',
  detail: 'px-4 py-4',
  fullscreen: 'p-0',
};

export function MobileShell({
  children,
  title,
  subtitle,
  leading,
  trailing,
  showTopBar = true,
  showBottomNav = true,
  variant = 'list',
  className,
  contentClassName,
}: MobileShellProps) {
  return (
    <div className={cn('mx-auto flex min-h-dvh w-full max-w-[var(--mobile-shell-max-width)] flex-col bg-background text-foreground md:max-w-none', className)}>
      {showTopBar && (
        <MobileTopBar title={title} subtitle={subtitle} leading={leading} trailing={trailing} />
      )}
      <main
        className={cn(
          'min-h-0 flex-1 overflow-x-hidden',
          showTopBar && 'pt-[calc(var(--mobile-safe-top))]',
          showBottomNav && 'pb-[calc(var(--mobile-bottom-nav-height)+var(--mobile-safe-bottom))]',
          variantClasses[variant],
          contentClassName,
        )}
      >
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
