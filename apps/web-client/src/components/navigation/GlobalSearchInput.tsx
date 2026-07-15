'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type SearchSuggestion = {
  id: string;
  text: string;
  type: 'USER' | 'MATERIAL' | 'POST' | 'PRODUCT' | 'GROUP';
  href: string;
  avatarUrl?: string | null;
  subtitle?: string;
};

export const GlobalSearchInput = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}&take=6`);
        const data = res.data?.data || res.data || {};
        const nextSuggestions: SearchSuggestion[] = [
          ...(data.users || []).map((user: any) => ({
            id: user.id,
            text: user.fullName || 'Người dùng',
            type: 'USER' as const,
            href: `/profile/${user.id}`,
            avatarUrl: user.avatarUrl ?? null,
            subtitle: [user.major, user.cohort ? `Khóa ${user.cohort}` : null].filter(Boolean).join(' · '),
          })),
          ...(data.materials || []).slice(0, 2).map((material: any) => ({
            id: material.id,
            text: material.title || 'Tài liệu',
            type: 'MATERIAL' as const,
            href: `/materials/${material.id}`,
            subtitle: material.subject || 'Tài liệu học tập',
          })),
          ...(data.posts || []).slice(0, 2).map((post: any) => ({
            id: post.id,
            text: post.content?.slice(0, 60) || 'Bài viết',
            type: 'POST' as const,
            href: '/feed',
            subtitle: `Bài viết của ${post.user?.fullName || 'người dùng'}`,
          })),
        ].slice(0, 8);
        setSuggestions(nextSuggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsFocused(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative hidden md:block" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative group">
        <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors z-10 ${isFocused ? 'text-primary' : 'text-foreground/60 group-hover:text-foreground/80'}`} />
        <input 
          type="text" 
          placeholder="Tìm kiếm trên CMC Network"
          className="w-[260px] focus:w-[320px] xl:focus:w-[360px] bg-hover hover:bg-hover/80 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-full py-2.5 pl-10 pr-4 text-[15px] font-medium transition-all duration-300 ease-out outline-none text-foreground"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
      </form>

      {/* Autocomplete Dropdown */}
      {isFocused && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl z-50 isolate">
          {/* Bulletproof Glass Background Layer */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--card) 60%, transparent)',
              backdropFilter: 'blur(32px) saturate(200%)',
              WebkitBackdropFilter: 'blur(32px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)'
            }}
          />
          <div className="relative z-10 overflow-hidden rounded-2xl">
            {isLoading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-bold text-foreground/50 uppercase tracking-wider">Đề xuất</div>
              {suggestions.map((s, i) => (
                <button
                  key={`${s.type}-${s.id}-${i}`}
                  className="w-full text-left px-4 py-2.5 hover:bg-hover text-sm font-medium text-foreground flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setQuery(s.text);
                    setIsFocused(false);
                    router.push(s.href);
                  }}
                >
                  {s.type === 'USER' ? (
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden shrink-0 font-bold">
                      {s.avatarUrl ? <img src={s.avatarUrl} alt="" className="w-full h-full object-cover" /> : s.text.charAt(0)}
                    </span>
                  ) : (
                    <Search className="w-4 h-4 text-foreground/50 shrink-0" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate">{s.text}</span>
                    {s.subtitle && <span className="block text-xs text-foreground/50 truncate">{s.subtitle}</span>}
                  </span>
                </button>
              ))}
              <div className="border-t border-border/30 mt-1">
                <button 
                  onClick={handleSubmit}
                  className="w-full text-center px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                >
                  Xem tất cả kết quả cho &quot;{query}&quot;
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-foreground/50">
              Không tìm thấy đề xuất nào
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};
