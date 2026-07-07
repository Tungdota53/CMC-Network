"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';

// BE-005: Global search UI — gọi 1 endpoint GET /search?q=&take= (debounced), hiển thị kết quả gom nhóm.
// Contract (API_CONTRACT.md):
//   { users:[...], groups:[...], materials:[...], products:[...], posts:[...] }

type SearchUser = { id: string; fullName: string; avatarUrl?: string | null; major?: string | null; cohort?: string | null };
type SearchGroup = { id: string; title: string; subject?: string; memberCount?: number; maxMembers?: number };
type SearchMaterial = { id: string; title: string; subject?: string; fileType?: string; downloadCount?: number };
type SearchProduct = { id: string; title: string; price?: number; category?: string; status?: string; images?: string[] };
type SearchPost = { id: string; content: string; createdAt: string; user?: { id: string; fullName: string; avatarUrl?: string | null } };

type SearchResults = {
  users: SearchUser[];
  groups: SearchGroup[];
  materials: SearchMaterial[];
  products: SearchProduct[];
  posts: SearchPost[];
};

const EMPTY: SearchResults = { users: [], groups: [], materials: [], products: [], posts: [] };

const totalCount = (r: SearchResults) =>
  r.users.length + r.groups.length + r.materials.length + r.products.length + r.posts.length;

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/search?q=${encodeURIComponent(q)}&take=5`);
      if (res.ok) {
        const data = await res.json();
        setResults({
          users: data.users || [],
          groups: data.groups || [],
          materials: data.materials || [],
          products: data.products || [],
          posts: data.posts || [],
        });
      }
    } catch {
      setResults(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce 300ms
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      const resetTimer = window.setTimeout(() => setResults(EMPTY), 0);
      return () => window.clearTimeout(resetTimer);
    }
    const timer = window.setTimeout(() => runSearch(q), 300);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    router.push(path);
  };

  const total = totalCount(results);
  const showPanel = open && query.trim().length >= 2;

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-2 w-[280px] transition-all focus-within:w-[320px] focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-[0_4px_14px_rgba(99,102,241,0.08)] group">
        <span className="text-slate-400 mr-2 group-focus-within:text-indigo-600 transition-colors">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Tìm kiếm sinh viên, nhóm..."
          className="bg-transparent border-none outline-none w-full text-sm text-slate-800 placeholder-slate-400"
        />
      </div>

      {showPanel && (
        <div className="absolute left-0 mt-2 w-[380px] glass rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 bg-white">
          <div className="max-h-[420px] overflow-y-auto p-2 custom-scrollbar">
            {loading ? (
              <p className="text-center text-slate-400 p-6 text-sm">Đang tìm...</p>
            ) : total === 0 ? (
              <p className="text-center text-slate-400 p-6 text-sm">Không tìm thấy kết quả cho “{query.trim()}”.</p>
            ) : (
              <>
                {results.users.length > 0 && (
                  <Section title="Sinh viên">
                    {results.users.map((u) => (
                      <Row key={u.id} onClick={() => go(`/profile/${u.id}`)} avatar={u.avatarUrl || `https://i.pravatar.cc/150?u=${u.id}`} title={u.fullName} subtitle={[u.major, u.cohort].filter(Boolean).join(' • ') || 'Cùng trường'} />
                    ))}
                  </Section>
                )}
                {results.groups.length > 0 && (
                  <Section title="Nhóm học tập">
                    {results.groups.map((g) => (
                      <Row key={g.id} onClick={() => go('/groups')} icon="👥" title={g.title} subtitle={[g.subject, g.memberCount != null ? `${g.memberCount}/${g.maxMembers ?? '∞'} thành viên` : null].filter(Boolean).join(' • ')} />
                    ))}
                  </Section>
                )}
                {results.materials.length > 0 && (
                  <Section title="Tài liệu">
                    {results.materials.map((m) => (
                      <Row key={m.id} onClick={() => go('/materials')} icon="📚" title={m.title} subtitle={[m.subject, m.fileType].filter(Boolean).join(' • ')} />
                    ))}
                  </Section>
                )}
                {results.products.length > 0 && (
                  <Section title="Chợ sinh viên">
                    {results.products.map((p) => (
                      <Row key={p.id} onClick={() => go('/marketplace')} avatar={p.images?.[0]} icon="🛒" title={p.title} subtitle={[p.price != null ? `${p.price.toLocaleString('vi-VN')}đ` : null, p.category].filter(Boolean).join(' • ')} />
                    ))}
                  </Section>
                )}
                {results.posts.length > 0 && (
                  <Section title="Bài viết">
                    {results.posts.map((p) => (
                      <Row key={p.id} onClick={() => go('/')} avatar={p.user?.avatarUrl || `https://i.pravatar.cc/150?u=${p.user?.id || p.id}`} title={p.user?.fullName || 'Bài viết'} subtitle={p.content?.slice(0, 60) || ''} />
                    ))}
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-3 pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</div>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

function Row({ onClick, avatar, icon, title, subtitle }: { onClick: () => void; avatar?: string | null; icon?: string; title: string; subtitle?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/80 transition-colors text-left group">
      {avatar ? (
        <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 group-hover:scale-105 transition-transform" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">{icon || '🔎'}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-800 truncate group-hover:text-slate-900 transition-colors">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-500 truncate mt-0.5">{subtitle}</p>}
      </div>
    </button>
  );
}
