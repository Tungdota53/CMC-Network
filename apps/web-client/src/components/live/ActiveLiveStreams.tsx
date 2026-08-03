'use client';

import Link from 'next/link';
import { Radio } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useLiveStreams } from '@/hooks/useLiveStreams';

export function ActiveLiveStreams() {
  const { data = [], isLoading } = useLiveStreams();
  if (!isLoading && data.length === 0) return null;

  return (
    <section aria-labelledby="active-live-title" className="overflow-hidden rounded-2xl border border-red-500/15 bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 id="active-live-title" className="flex items-center gap-2 text-sm font-bold"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" /></span>Đang phát trực tiếp</h2>
        {data.length > 0 && <span className="text-xs text-muted-foreground">{data.length} phiên</span>}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 pt-2">
        {isLoading ? <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" /> : data.map((stream) => (
          <Link key={stream.id} href={`/live/${stream.id}`} className="group flex min-w-[260px] items-center gap-3 rounded-2xl border border-border bg-background/70 p-3 transition hover:border-red-500/30 hover:shadow-md">
            <div className="relative"><Avatar src={stream.host.avatarUrl || undefined} fallback={stream.host.fullName.charAt(0)} size="lg" /><span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span></div>
            <div className="min-w-0"><div className="line-clamp-2 text-sm font-semibold group-hover:text-red-600">{stream.title}</div><div className="mt-1 truncate text-xs text-muted-foreground">{stream.host.fullName}</div><div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600"><Radio className="h-3 w-3" />Xem ngay</div></div>
          </Link>
        ))}
      </div>
    </section>
  );
}