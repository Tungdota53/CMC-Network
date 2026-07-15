'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostCard } from '@/components/feed/PostCard';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { StoryCarousel } from '@/components/stories/StoryCarousel';
import { EmptyState, ErrorState, PullToRefresh, SegmentedTabs } from '@/components/mobile';
import { useFeed, useLatestFeed, Post } from '@/hooks/useFeed';
import { Bell, Flame, Clock, Pencil, Search } from 'lucide-react';

type FeedTab = 'trending' | 'latest';

export default function FeedPage() {
  const [tab, setTab] = useState<FeedTab>('trending');
  const observerRef = useRef<HTMLDivElement>(null);

  const trendingQuery = useFeed();
  const latestQuery = useLatestFeed();

  const activeQuery = tab === 'trending' ? trendingQuery : latestQuery;
  const posts: Post[] = activeQuery.data?.pages.flatMap((p) => p.posts) ?? [];
  const feedTabs = [
    { value: 'latest' as const, label: 'Mới nhất', icon: <Clock className="h-4 w-4" aria-hidden="true" /> },
    { value: 'trending' as const, label: 'Nổi bật', icon: <Flame className="h-4 w-4" aria-hidden="true" /> },
  ];

  // Infinite scroll via IntersectionObserver
  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
            activeQuery.fetchNextPage();
          }
        },
        { rootMargin: '400px' },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [activeQuery.hasNextPage, activeQuery.isFetchingNextPage, activeQuery.fetchNextPage],
  );

  const refreshFeed = async () => {
    await activeQuery.refetch();
  };

  return (
    <PullToRefresh onRefresh={refreshFeed} className="w-full">
      <div className="mx-auto w-full max-w-[860px] space-y-4 px-0 py-3 sm:px-0 sm:py-4">
      <div className="rounded-3xl border border-border bg-card/80 p-3 shadow-sm backdrop-blur md:hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <Link href="/search" className="flex min-h-11 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-medium text-muted-foreground" aria-label="Tìm kiếm trong CMC Network">
            <Search className="h-4 w-4" aria-hidden="true" />
            Tìm kiếm
          </Link>
          <Link href="/notifications" className="relative flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-border bg-background text-foreground" aria-label="Thông báo, 0 thông báo chưa đọc">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Link>
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('cmc:create-post'))} className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground" aria-label="Tạo bài viết nhanh">
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Create Post */}
      <CreatePost />

      {/* Stories Carousel */}
      <StoryCarousel />

      {/* Feed Filters */}
      <div className="flex items-center justify-between border-b border-border/50 px-2 pb-1 pt-2 max-sm:flex-col max-sm:items-stretch max-sm:gap-3 max-sm:border-none max-sm:px-0">
        <h3 className="font-bold text-foreground text-[16px]">Bảng tin</h3>
        <div className="hidden items-center gap-1 sm:flex">
          <button
            onClick={() => setTab('latest')}
            aria-pressed={tab === 'latest'}
            className={`text-[14px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${tab === 'latest' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:bg-hover'}`}
          >
            <Clock className="w-4 h-4" />
            Mới nhất
          </button>
          <button
            onClick={() => setTab('trending')}
            aria-pressed={tab === 'trending'}
            className={`text-[14px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${tab === 'trending' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:bg-hover'}`}
          >
            <Flame className="w-4 h-4" />
            Nổi bật
          </button>
        </div>
        <SegmentedTabs items={feedTabs} value={tab} onChange={setTab} className="sm:hidden" ariaLabel="Bộ lọc bảng tin" />
      </div>

      {/* Posts Feed */}
      {activeQuery.isError ? (
        <ErrorState
          title="Không tải được bảng tin"
          description="Kiểm tra mạng rồi thử lại."
          action={(
            <button type="button" onClick={() => activeQuery.refetch()} className="min-h-11 rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white">
              Tải lại
            </button>
          )}
        />
      ) : activeQuery.isLoading ? (
        <PostSkeleton count={3} />
      ) : posts.length === 0 ? (
        <EmptyState
          title="Chưa có bài viết nào"
          description="Hãy là người đầu tiên chia sẻ với cộng đồng CMC."
          action={(
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('cmc:create-post'))} className="min-h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Tạo bài viết
            </button>
          )}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div key={post.id} ref={index === posts.length - 1 ? lastPostRef : undefined}>
              <PostCard post={post} />
            </div>
          ))}

          {/* Loading more indicator */}
          {activeQuery.isFetchingNextPage && <PostSkeleton count={2} />}
        </div>
      )}

      {/* Sentinel for observer */}
      <div ref={observerRef} className="h-1" />
      </div>
    </PullToRefresh>
  );
}
