'use client';
import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Users, MessageSquare, FileText, ShoppingCart, ChevronRight, Star, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setInputValue(initialQuery);
    setActiveQuery(initialQuery);
  }, [initialQuery]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', activeQuery],
    queryFn: async () => {
      if (!activeQuery.trim()) return { users: [], groups: [], materials: [], products: [], posts: [] };
      const res = await api.get(`/search?q=${encodeURIComponent(activeQuery)}&take=20`);
      return res.data.data;
    },
    enabled: !!activeQuery.trim(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(inputValue);
    router.push(`/search?q=${encodeURIComponent(inputValue)}`);
  };

  const TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'users', label: `Người dùng (${results?.users?.length || 0})` },
    { id: 'posts', label: `Bài viết (${results?.posts?.length || 0})` },
    { id: 'materials', label: `Tài liệu (${results?.materials?.length || 0})` },
    { id: 'products', label: `Sản phẩm (${results?.products?.length || 0})` },
    { id: 'groups', label: `Nhóm (${results?.groups?.length || 0})` },
  ];

  const totalCount = (results?.users?.length || 0) + (results?.posts?.length || 0) + (results?.materials?.length || 0) + (results?.products?.length || 0) + (results?.groups?.length || 0);

  return (
    <div className="max-w-[800px] w-full pb-20 pt-6 px-4">
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tìm kiếm người dùng, bài viết, tài liệu..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
        <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm">
          Tìm kiếm
        </button>
      </form>

      {activeQuery && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-500 font-medium">
            {isLoading ? 'Đang tìm kiếm...' : <>Tìm thấy <span className="font-bold text-gray-900">{totalCount}</span> kết quả cho &quot;{activeQuery}&quot;</>}
          </p>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      )}

      {!isLoading && !activeQuery && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <SearchIcon className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Nhập từ khóa để bắt đầu tìm kiếm</p>
        </div>
      )}

      {!isLoading && activeQuery && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg font-medium">Không tìm thấy kết quả nào</p>
        </div>
      )}

      {!isLoading && results && (
        <div className="space-y-8">
          {(activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-indigo-500" /> Người dùng
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {results.users.map((u: any) => (
                  <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-4 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 overflow-hidden shrink-0">
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : u.fullName?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{u.fullName}</h3>
                      <p className="text-sm text-gray-500">{u.major || ''} {u.cohort ? `· ${u.cohort}` : ''}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-500" /> Bài viết
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {results.posts.map((p: any) => (
                  <Link key={p.id} href={`/feed`} className="block p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{p.content?.slice(0, 100) || p.title || ''}</h3>
                    <p className="text-xs text-gray-500">Đăng bởi {p.author?.fullName || p.user?.fullName || 'Unknown'} · {new Date(p.createdAt).toLocaleDateString('vi-VN')}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'materials') && results.materials?.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-orange-500" /> Tài liệu học tập
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {results.materials.map((m: any) => (
                  <Link key={m.id} href={`/materials/${m.id}`} className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{m.title}</h3>
                      <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                        {m.downloadCount != null && <span>{m.downloadCount} lượt tải</span>}
                        {m.subject && <span>· {m.subject}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'products') && results.products?.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-green-500" /> Sản phẩm
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {results.products.map((p: any) => (
                  <Link key={p.id} href={`/marketplace/${p.id}`} className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
                      <span className="text-sm font-bold text-primary">{Number(p.price).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'groups') && results.groups?.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-500" /> Nhóm học
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {results.groups.map((g: any) => (
                  <Link key={g.id} href={`/study/groups/${g.id}`} className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{g.title}</h3>
                      <p className="text-sm text-gray-500">{g.subject} · {g.memberCount}/{g.maxMembers} thành viên</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
