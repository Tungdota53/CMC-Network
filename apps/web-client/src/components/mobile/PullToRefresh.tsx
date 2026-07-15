'use client';

import React, { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}

const THRESHOLD = 72;

export function PullToRefresh({ children, onRefresh, disabled, className }: PullToRefreshProps) {
  const startY = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || window.scrollY > 0) return;
    startY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || startY.current === null || window.scrollY > 0) return;
    const diff = Math.max(0, (event.touches[0]?.clientY ?? 0) - startY.current);
    setOffset(Math.min(diff * 0.45, THRESHOLD));
  };

  const handleTouchEnd = async () => {
    if (disabled || startY.current === null) return;
    const shouldRefresh = offset >= THRESHOLD * 0.75;
    startY.current = null;
    if (!shouldRefresh) {
      setOffset(0);
      return;
    }
    setRefreshing(true);
    setOffset(44);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setOffset(0);
    }
  };

  return (
    <div
      className={cn('relative min-h-0 overflow-visible', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="pointer-events-none sticky top-0 z-10 flex h-0 justify-center" aria-live="polite">
        <div
          className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm transition-transform"
          style={{ transform: `translateY(${Math.max(offset - 44, -44)}px)` }}
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden="true" />
          <span className="sr-only">{refreshing ? 'Đang làm mới' : 'Kéo để làm mới'}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
