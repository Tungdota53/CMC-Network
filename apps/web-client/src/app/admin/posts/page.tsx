'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Image as ImageIcon, MessageSquare, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Post {
  id: string;
  content: string;
  author: {
    fullName: string;
    avatarUrl: string;
  };
  createdAt: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/posts');
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const deletePost = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete post', err);
      alert('Không thể xóa bài viết!');
    }
  };

  const filteredPosts = posts.filter(p => 
    p.content?.toLowerCase().includes(search.toLowerCase()) || 
    p.author?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Kiểm duyệt Bài Đăng (Posts)</h1>
          <p className="text-gray-500 text-sm">Quản lý nội dung thảo luận trên bảng tin thực tế từ database.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Tìm theo nội dung, tác giả..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-full py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold w-1/2">Nội dung</th>
                  <th className="px-6 py-4 font-semibold">Tác giả</th>
                  <th className="px-6 py-4 font-semibold">Thời gian</th>
                  <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPosts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-gray-800 line-clamp-2 leading-relaxed">{post.content}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{post.author?.fullName || 'Ẩn danh'}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(post.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => deletePost(post.id)} title="Xóa bài viết">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPosts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy bài viết nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
