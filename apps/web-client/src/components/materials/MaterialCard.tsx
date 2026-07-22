import React from 'react';
import { Bookmark, Download, Star, BadgeCheck } from 'lucide-react';
import { FileTypeIcon } from './FileTypeIcon';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import type { MaterialViewModel } from './materialViewModel';

export const MaterialCard = ({ material }: { material: MaterialViewModel }) => {
  const uploaderFallback = material.uploaderName.charAt(0).toUpperCase() || 'C';

  return (
    <Link href={`/materials/${material.id}`} className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
      <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <FileTypeIcon type={material.fileType} className="h-11 w-11" />
          <div className="flex items-center gap-2">
            {material.semester && <span className="rounded-full border border-border bg-hover px-2.5 py-1 text-[11px] font-semibold text-foreground/60">{material.semester}</span>}
            <span className="rounded-md bg-foreground/[0.06] px-2 py-1 text-[10px] font-bold text-foreground/55">{material.fileType}</span>
          </div>
        </div>

        <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-foreground transition-colors group-hover:text-primary">
          {material.title}
        </h3>
        <p className="mt-2 line-clamp-1 text-xs font-semibold uppercase tracking-wide text-primary/80">{material.subject}</p>

        <div className="mt-5 flex items-center gap-2.5 border-t border-border pt-4">
          <Avatar src={material.uploaderAvatar || undefined} fallback={uploaderFallback} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/75">{material.uploaderName}</span>
          {material.uploaderVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Tài khoản đã xác minh" />}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-medium text-foreground/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="Lượt lưu"><Bookmark className="h-3.5 w-3.5" />{material.bookmarkCount}</span>
            <span className="flex items-center gap-1" title="Lượt tải"><Download className="h-3.5 w-3.5" />{material.downloadCount}</span>
            {material.reviewCount > 0 && <span className="flex items-center gap-1" title="Đánh giá"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{material.rating.toFixed(1)}</span>}
          </div>
          {material.fileSize && <span className="rounded-md bg-hover px-2 py-1">{material.fileSize}</span>}
        </div>
      </article>
    </Link>
  );
};
