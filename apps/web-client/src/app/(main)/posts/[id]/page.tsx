'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { PostCard } from '@/components/feed/PostCard';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { EmptyState, ErrorState } from '@/components/mobile';
import { usePost } from '@/hooks/useFeed';

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id;
  const postQuery = usePost(postId);

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-4 px-0 py-3 sm:py-4">
      <div className="flex items-center gap-3 rounded-3xl border border-border bg-card/80 p-3 shadow-sm backdrop-blur">
        <Link
          href="/feed"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-border bg-background text-foreground transition-colors hover:bg-hover"
          aria-label="Quay lại bảng tin"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground">Bài viết</h1>
          <p className="truncate text-sm text-muted-foreground">Xem bài viết được chia sẻ từ bảng tin.</p>
        </div>
      </div>

      {postQuery.isLoading ? (
        <PostSkeleton count={1} />
      ) : postQuery.isError ? (
        <ErrorState
          title="Không mở được link bài viết"
          description="Bài viết có thể đã bị xóa, bị ẩn hoặc bạn không có quyền xem."
          action={(
            <button
              type="button"
              onClick={() => postQuery.refetch()}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Thử lại
            </button>
          )}
        />
      ) : postQuery.data ? (
        <PostCard post={postQuery.data} />
      ) : (
        <EmptyState title="Không tìm thấy bài viết" description="Link này không còn khả dụng." />
      )}
    </div>
  );
}