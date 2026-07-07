import React from 'react';

/**
 * Skeleton — a single shimmer block. Compose these to mirror the shape
 * of the content that is loading. Uses the `.skeleton` utility (shimmer
 * + theme-aware base) defined in globals.css.
 */
export function Skeleton({
  className = '',
  rounded = 'rounded-xl',
}: {
  className?: string;
  rounded?: string;
}) {
  return <div className={`skeleton ${rounded} ${className}`} />;
}

/**
 * SkeletonText — N shimmer lines, last one shortened like a paragraph tail.
 */
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          rounded="rounded-md"
          className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard — a glass card placeholder shaped like a feed post.
 */
export function SkeletonCard() {
  return (
    <div className="w-full glass rounded-3xl p-5 animate-fade-rise">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton rounded="rounded-full" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton rounded="rounded-md" className="h-3.5 w-40" />
          <Skeleton rounded="rounded-md" className="h-3 w-24" />
        </div>
      </div>
      <SkeletonText lines={3} className="mb-4" />
      <Skeleton className="h-52 w-full rounded-2xl" />
    </div>
  );
}

/**
 * SkeletonGridCard — placeholder for marketplace/materials tile grids.
 */
export function SkeletonGridCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-rise">
      <Skeleton rounded="rounded-none" className="h-40 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton rounded="rounded-md" className="h-4 w-3/4" />
        <Skeleton rounded="rounded-md" className="h-3 w-1/2" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton rounded="rounded-full" className="w-7 h-7" />
          <Skeleton rounded="rounded-md" className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonRow — placeholder for list rows (leaderboard, attendees, etc).
 */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 animate-fade-rise">
      <Skeleton rounded="rounded-full" className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton rounded="rounded-md" className="h-3.5 w-1/3" />
        <Skeleton rounded="rounded-md" className="h-3 w-1/4" />
      </div>
      <Skeleton rounded="rounded-md" className="h-6 w-14" />
    </div>
  );
}

export default Skeleton;
