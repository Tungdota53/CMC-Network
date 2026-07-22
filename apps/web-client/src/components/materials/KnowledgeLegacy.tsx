'use client';

import React from 'react';
import { MaterialCard } from './MaterialCard';
import { Sparkles, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractList } from '@/lib/adapters';
import { toMaterialViewModel, type MaterialApiItem } from './materialViewModel';

export const KnowledgeLegacy = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['legacy-materials'],
    queryFn: async () => {
      const response = await api.get('/materials/legacy/recommendations');
      return extractList<MaterialApiItem>(response).map(toMaterialViewModel);
    }
  });

  const materials = Array.isArray(data) ? data : [];

  if (!isLoading && materials.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="legacy-title" className="relative mb-10 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 shadow-sm lg:p-8">
      
      <div className="flex flex-col lg:flex-row gap-10 items-center">
        {/* Left Section: Header & Context */}
        <div className="w-full lg:w-1/3 flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-3 mb-4 bg-primary/10 w-max px-4 py-2 rounded-full border border-primary/20 shadow-inner">
            <Sparkles className="w-4 h-4 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] animate-pulse" />
            <span className="text-sm font-bold text-primary tracking-wide uppercase">Di sản tri thức</span>
          </div>
          <h2 id="legacy-title" className="mb-4 text-3xl font-black leading-tight tracking-tight text-foreground lg:text-4xl">
            Tài liệu nổi bật
          </h2>
          <p className="text-base text-foreground/70 mb-8 font-medium leading-relaxed max-w-md">
            Những tài liệu kinh điển, đồ án xuất sắc và slide bài giảng chất lượng cao được lưu truyền qua các thế hệ sinh viên.
          </p>
        </div>

        {/* Right Section: Content Slider */}
        <div className="w-full lg:w-2/3 flex-1 relative z-10">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 bg-black/10 rounded-3xl border border-white/5">
              <Loader2 className="w-10 h-10 animate-spin text-primary drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)]" />
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-6 pt-2 px-2 -mx-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {materials.map((item) => (
                <div key={item.id} className="min-w-[280px] sm:min-w-[320px] max-w-[320px] snap-center shrink-0">
                  <MaterialCard material={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
