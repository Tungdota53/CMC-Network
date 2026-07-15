'use client';

import { cn } from '@/lib/utils';

export interface SegmentedTabItem<T extends string> {
  value: T;
  label: string;
  badge?: number;
}

interface SegmentedTabsProps<T extends string> {
  items: SegmentedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedTabs<T extends string>({ items, value, onChange, ariaLabel, className }: SegmentedTabsProps<T>) {
  return (
    <div className={cn('flex gap-1 rounded-2xl bg-hover/70 p-1', className)} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'mobile-touch-target flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition',
              active ? 'bg-background text-primary shadow-sm' : 'text-foreground/60 hover:text-foreground',
            )}
          >
            <span>{item.label}</span>
            {!!item.badge && item.badge > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 text-white">{item.badge > 99 ? '99+' : item.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
