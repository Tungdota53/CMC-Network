'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';

type AdminPost = {
  id: string;
  user?: { fullName?: string | null };
  createdAt: string;
  content?: string | null;
  type?: string | null;
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await apiFetch('/api/posts/admin/all');
        if (res.ok) setPosts(await res.json());
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa bài viết này?')) return;

    const res = await apiFetch(`/api/posts/admin/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Quản lý bài viết</h2>
        <p className="text-gray-400 mt-1">Xem xét nội dung và quản lý bài viết vi phạm.</p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Chưa có bài viết nào.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-sm">
                <th className="p-4 font-medium w-1/4">Tác giả</th>
                <th className="p-4 font-medium w-1/2">Nội dung</th>
                <th className="p-4 font-medium">Loại</th>
                <th className="p-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-800/80 transition-colors">
                  <td className="p-4 text-white font-medium">
                    {post.user?.fullName || 'Ẩn danh'}
                    <div className="text-xs text-gray-500 font-normal">{new Date(post.createdAt).toLocaleString('vi-VN')}</div>
                  </td>
                  <td className="p-4 text-gray-300">
                    <div className="line-clamp-2">{post.content || '(Không có nội dung)'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {post.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-colors"
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
