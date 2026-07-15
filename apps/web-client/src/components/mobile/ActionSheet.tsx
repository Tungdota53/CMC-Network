'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionSheetProps {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export function ActionSheet({ open, title, description, children, onClose, className }: ActionSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const firstButton = panelRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstButton?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--mobile-z-sheet)] flex items-end bg-black/40 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-6" role="presentation">
      <button className="absolute inset-0 cursor-default" aria-label="Đóng bảng thao tác" onClick={onClose} />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-action-sheet-title"
        aria-describedby={description ? 'mobile-action-sheet-description' : undefined}
        className={cn(
          'relative max-h-[calc(100dvh-1rem)] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-border bg-background p-4 pb-[calc(var(--mobile-safe-bottom)+1rem)] shadow-2xl md:max-w-md md:rounded-3xl md:pb-4',
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border md:hidden" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="mobile-action-sheet-title" className="text-lg font-bold text-foreground">{title}</h2>
            {description && <p id="mobile-action-sheet-description" className="mt-1 text-sm text-foreground/60">{description}</p>}
          </div>
          <button onClick={onClose} className="mobile-touch-target rounded-full text-foreground/60 hover:bg-hover hover:text-foreground" aria-label="Đóng">
            <X className="mx-auto h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
