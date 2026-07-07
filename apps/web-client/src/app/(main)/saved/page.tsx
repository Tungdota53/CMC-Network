"use client";

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';
import { SkeletonCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

// BE-006: trang "Bài viết đã lưu"
// Endpoints: GET /posts/saved/:userId, POST /posts/:id/save (toggle)

type SavedUser = { id?: string; fullName?: string; avatarUrl?: string | null };

type SavedPost = {
  id: string;
  userId: string;
  content: string;
  mediaUrls?: string[];
  likes?: number;
  commentCount?: number;
  shareCount?: number;
  saveCount?: number;
  createdAt: string;
  user?: SavedUser;
};

const getAvatar = (user: SavedUser | null | undefined, fallbackId: string) => user?.avatarUrl || `https://i.pravatar.cc/150?u=${fallbackId}`;

export default function SavedPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/posts/saved/${user.id}`);
      if (!res.ok) throw new Error('Không thể tải bài viết đã lưu');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải bài viết đã lưu');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const handleUnsave = async (post: SavedPost) => {
    if (!user?.id) return;
    setActingId(post.id);
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    try {
      await apiFetch(`/posts/${post.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch {
      // nếu lỗi, để người dùng tải lại trang
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col mx-auto space-y-6 pb-20">
      <div className="glass rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Bài viết đã lưu</h1>
          <p className="text-gray-400 text-sm mt-1">Tất cả bài viết bạn đã đánh dấu lưu để đọc lại sau.</p>
        </div>
      </div>

      {error && <div className="glass rounded-2xl p-4 text-red-500 border border-red-500/20">{error}</div>}
      {loading && (
        <div className="w-full space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <EmptyState
          icon="🔖"
          title="Bạn chưa lưu bài viết nào"
          description='Nhấn nút "Lưu" trên bất kỳ bài viết nào để đánh dấu đọc lại sau.'
        />
      )}

      {posts.map((post) => (
        <div key={post.id} className="w-full glass rounded-3xl overflow-hidden hover:border-white/20 transition-colors">
          <div className="flex justify-between items-start p-5">
            <div className="flex items-center gap-3">
              <img src={getAvatar(post.user, post.userId)} className="w-12 h-12 rounded-full object-cover border border-white/10" alt="" />
              <div>
                <h3 className="font-bold text-[16px] text-gray-100 leading-tight">{post.user?.fullName || 'Người dùng'}</h3>
                <p className="text-[13px] text-gray-500 mt-1">{new Date(post.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
            <button onClick={() => handleUnsave(post)} disabled={actingId === post.id} className="px-4 h-9 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 text-[13px] font-semibold transition-colors disabled:opacity-50">
              {actingId === post.id ? '...' : '🔖 Bỏ lưu'}
            </button>
          </div>
          {post.content && <p className="px-5 pb-4 text-gray-300 text-[15px] leading-relaxed">{post.content}</p>}
          {(post.mediaUrls || []).length > 0 && (
            <div className="px-5 pb-5 grid grid-cols-1 gap-2">
              {(post.mediaUrls || []).map((url) => (
                <img key={url} src={url} className="w-full max-h-[420px] rounded-2xl object-cover border border-white/10" alt="" />
              ))}
            </div>
          )}
          <div className="px-5 py-3 border-t border-white/5 text-[13px] text-gray-500 flex gap-4">
            <span>❤️ {post.likes ?? 0}</span>
            <span>💬 {post.commentCount ?? 0}</span>
            <span>🔗 {post.shareCount ?? 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
