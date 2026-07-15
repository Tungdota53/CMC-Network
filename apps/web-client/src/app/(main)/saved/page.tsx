'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, FileText, Loader2, MessageSquare, Search } from 'lucide-react';
import api from '@/lib/api';
import { mapBackendPost, type Post } from '@/hooks/useFeed';
import { useAuthStore } from '@/store/authStore';
import { PostCard } from '@/components/feed/PostCard';
import { EmptyState, ErrorState, SegmentedTabs } from '@/components/mobile';
import { useState } from 'react';

type SavedTab = 'posts' | 'materials';

interface SavedMaterial {
  id: string;
  title: string;
  description?: string | null;
  fileType?: string | null;
  courseName?: string | null;
  createdAt?: string;
}

const tabs = [
  { value: 'posts' as const, label: 'Bài viết', icon: <MessageSquare className="h-4 w-4" aria-hidden="true" /> },
  { value: 'materials' as const, label: 'Tài liệu', icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
];

export default function SavedPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<SavedTab>('posts');

  const savedPosts = useQuery({
    queryKey: ['saved-posts', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get(`/posts/saved/${user?.id}`);
      const payload = res.data?.data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload?.posts ?? [])).map(mapBackendPost) as Post[];
    },
  });

  const savedMaterials = useQuery({
    queryKey: ['saved-materials'],
    queryFn: async () => {
      const res = await api.get('/materials/bookmarks');
      const payload = res.data?.data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload?.materials ?? payload?.bookmarks ?? [])) as SavedMaterial[];
    },
  });

  const isLoading = tab === 'posts' ? savedPosts.isLoading : savedMaterials.isLoading;
  const isError = tab === 'posts' ? savedPosts.isError : savedMaterials.isError;

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-4 pb-24 pt-3 sm:pt-6">
      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bookmark className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-foreground">Đã lưu</h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Gom bài viết và tài liệu đã đánh dấu để quay lại nhanh khi học hoặc thảo luận.
            </p>
          </div>
        </div>
      </section>

      <SegmentedTabs items={tabs} value={tab} onChange={setTab} ariaLabel="Nội dung đã lưu" />

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-border bg-card">
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Đang tải nội dung đã lưu" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Không tải được nội dung đã lưu"
          description="Kiểm tra mạng rồi thử lại."
          action={(
            <button
              type="button"
              onClick={() => (tab === 'posts' ? savedPosts.refetch() : savedMaterials.refetch())}
              className="min-h-11 rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white"
            >
              Tải lại
            </button>
          )}
        />
      ) : tab === 'posts' ? (
        savedPosts.data && savedPosts.data.length > 0 ? (
          <div className="space-y-4">
            {savedPosts.data.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <EmptyState
            title="Chưa lưu bài viết nào"
            description="Bấm biểu tượng lưu ở bài viết để thêm vào đây."
            action={<Link href="/feed" className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Mở bảng tin</Link>}
          />
        )
      ) : savedMaterials.data && savedMaterials.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {savedMaterials.data.map((material) => (
            <Link key={material.id} href={`/materials/${material.id}`} className="rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="line-clamp-2 text-base font-bold text-foreground">{material.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{material.description || material.courseName || 'Tài liệu đã lưu'}</p>
              <span className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary">Mở tài liệu</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa lưu tài liệu nào"
          description="Bookmark tài liệu học tập để xem lại nhanh."
          action={<Link href="/materials" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Search className="h-4 w-4" /> Tìm tài liệu</Link>}
        />
      )}
    </div>
  );
}
