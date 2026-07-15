'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Compass, Loader2, Search, Sparkles } from 'lucide-react';
import { ClubCard } from '@/components/clubs/ClubCard';
import { useClubs } from '@/hooks/useClubs';

const categories = ['Tất cả', 'Học thuật', 'Công nghệ', 'Nghệ thuật', 'Thể thao', 'Tình nguyện', 'Sở thích'];

export default function ClubDiscoverPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const { data: clubs = [], isLoading } = useClubs();

  const filteredClubs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return clubs.filter((club) => {
      const matchesSearch = !keyword || club.name.toLowerCase().includes(keyword) || club.description?.toLowerCase().includes(keyword);
      const matchesCategory = category === 'Tất cả' || club.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, clubs, search]);

  const suggestedClubs = filteredClubs.slice(0, 3);

  return (
    <div className="max-w-[1100px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/clubs" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại CLB
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Gợi ý cộng đồng phù hợp
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 flex items-center gap-3">
            <Compass className="w-9 h-9 text-primary" /> Khám phá CLB
          </h1>
          <p className="text-foreground/65 leading-relaxed">Tìm CLB học tập, nhóm sở thích và cộng đồng sinh viên phù hợp với mục tiêu của bạn.</p>
        </div>
      </section>

      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mô tả CLB..."
            className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${category === item ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground/70 hover:bg-hover border border-border'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-foreground/60">
          Không tìm thấy CLB phù hợp.
        </div>
      ) : (
        <div className="space-y-8">
          {suggestedClubs.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Gợi ý nổi bật</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {suggestedClubs.map((club) => <ClubCard key={club.id} {...club} />)}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Tất cả kết quả ({filteredClubs.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClubs.map((club) => <ClubCard key={club.id} {...club} />)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
