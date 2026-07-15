'use client';

import { Loader2 } from 'lucide-react';
import { errorMessage } from '@/lib/adapters';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  message = 'Đang tải...',
  className,
  size = 'md',
}: LoadingStateProps) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground', className)}>
      <Loader2 className={cn(iconSize, 'animate-spin')} />
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = 'Đã xảy ra lỗi',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12', className)}>
      <div className="rounded-full bg-red-50 p-3 dark:bg-red-950/30">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m6-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-hover-bg transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M19.5 12a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
          </svg>
          Thử lại
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'Chưa có dữ liệu',
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      {icon && <div className="text-muted-foreground/40">{icon}</div>}
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground/70 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

/**
 * Convenience wrapper: pick the right state based on React Query flags.
 */
interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error?: unknown;
  onRetry?: () => void;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  children: React.ReactNode;
}

export function QueryState({
  isLoading,
  isError,
  isEmpty,
  error,
  onRetry,
  loadingMessage,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  children,
}: QueryStateProps) {
  if (isLoading) return <LoadingState message={loadingMessage} />;
  if (isError) {
    return <ErrorState message={errorMessage(error)} onRetry={onRetry} />;
  }
  if (isEmpty) return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} action={emptyAction} />;
  return <>{children}</>;
}