export function PostSkeleton({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-4 animate-pulse">
          {/* Header skeleton */}
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-hover" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-hover rounded" />
              <div className="h-3 w-20 bg-hover rounded" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full bg-hover rounded" />
            <div className="h-4 w-3/4 bg-hover rounded" />
          </div>

          {/* Image skeleton */}
          <div className="h-48 w-full bg-hover rounded-lg mb-4" />

          {/* Actions skeleton */}
          <div className="flex justify-between pt-3 border-t border-border">
            <div className="h-8 w-24 bg-hover rounded" />
            <div className="h-8 w-24 bg-hover rounded" />
            <div className="h-8 w-24 bg-hover rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
