'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface MobileTopBarProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export function MobileTopBar({ title, subtitle, leading, trailing, className }: MobileTopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--mobile-z-topbar)] flex min-h-[var(--mobile-topbar-height)] items-center gap-3 border-b border-border bg-background/95 px-4 pt-[var(--mobile-safe-top)] backdrop-blur-xl md:hidden',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {leading && <div className="flex shrink-0 items-center justify-center">{leading}</div>}
        <div className="min-w-0 flex-1 py-2">
          {title && <h1 className="truncate text-[18px] font-bold leading-6 text-foreground">{title}</h1>}
          {subtitle && <p className="truncate text-xs leading-4 text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </header>
  );
}
