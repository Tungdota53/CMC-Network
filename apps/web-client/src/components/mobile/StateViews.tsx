import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StateViewProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: StateViewProps) {
  return (
    <div className={cn('flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-6 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-hover text-foreground/50">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-foreground/60">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, description, action, className }: StateViewProps) {
  return (
    <div className={cn('flex min-h-48 flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-500/30 dark:bg-red-500/10', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-bold">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm opacity-80">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface SkeletonProps {
  rows?: number;
  className?: string;
}

export function MobileSkeleton({ rows = 4, className }: SkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} aria-label="Đang tải" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex animate-pulse gap-3 rounded-3xl border border-border bg-card p-3">
          <div className="h-12 w-12 rounded-full bg-hover" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="h-3 w-2/3 rounded-full bg-hover" />
            <div className="h-3 w-1/2 rounded-full bg-hover" />
          </div>
        </div>
      ))}
    </div>
  );
}
