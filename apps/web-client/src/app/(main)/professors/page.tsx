'use client';

import React, { useState } from 'react';
import { ProfessorCard } from '@/components/professors/ProfessorCard';
import { Search, SlidersHorizontal, Trophy, GraduationCap } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useProfessors } from '@/hooks/useProfessors';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

const FACULTIES = ['Tất cả', 'Công Nghệ Thông Tin', 'Kinh Tế', 'Ngoại Ngữ', 'Truyền Thông', 'Kỹ Thuật'];

export default function ProfessorsPage() {
  const [activeFaculty, setActiveFaculty] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [searchQuery, setSearchQuery] = useState('');

  const sortOptions = [
    { label: 'Đánh giá cao nhất', value: 'rating_desc' },
    { label: 'Nhiều lượt đánh giá', value: 'reviews_desc' },
    { label: 'Tên (A-Z)', value: 'name_asc' },
  ];

  const { data, isLoading, isError, error, refetch } = useProfessors({
    search: searchQuery || undefined,
    faculty: activeFaculty !== 'Tất cả' ? activeFaculty : undefined,
    sort: sortBy,
  });

  const professors = Array.isArray(data) ? data : [];

  return (
    <div className="w-full px-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-3xl p-8 md:p-12 mb-8 overflow-hidden bg-card border border-border shadow-sm">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <GraduationCap className="w-4 h-4" />
            CMC Campus Mentors
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-foreground leading-tight">
            Đánh giá <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">Giảng viên</span>
          </h1>
          <p className="text-foreground/60 text-lg mb-8 max-w-2xl leading-relaxed">
            Tra cứu và chia sẻ kinh nghiệm học tập thực tế từ hàng ngàn sinh viên. Giúp bạn đưa ra quyết định đăng ký môn học sáng suốt nhất.
          </p>
          <div className="flex flex-col sm:flex-row items-center bg-background/50 backdrop-blur-md border border-border p-2 rounded-2xl max-w-2xl shadow-lg transition-all focus-within:border-primary/50 focus-within:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
            <div className="pl-4 pr-2 hidden sm:block">
              <Search className="w-6 h-6 text-foreground/40" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên giảng viên, mã môn hoặc khoa..."
              className="flex-1 w-full bg-transparent border-none text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-0 px-4 py-3 sm:py-2 text-[15px]"
            />
            <button className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-[0_4px_14px_rgba(59,130,246,0.3)]">
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-72 shrink-0">
          <div className="bg-card rounded-2xl p-6 border border-border sticky top-20 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-foreground mb-6 pb-4 border-b border-border/50 text-[17px]">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              Bộ lọc nâng cao
            </div>
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-bold text-foreground/80 mb-4 uppercase tracking-wider">Khoa / Viện</h4>
                <div className="space-y-3">
                  {FACULTIES.map(f => (
                    <label key={f} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${activeFaculty === f ? 'bg-primary border-primary text-white shadow-[0_2px_8px_rgba(59,130,246,0.4)]' : 'border-border bg-background group-hover:border-primary/50'}`}>
                        {activeFaculty === f && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                      </div>
                      <span className={`text-[15px] transition-colors ${activeFaculty === f ? 'font-semibold text-foreground' : 'text-foreground/60 group-hover:text-foreground'}`}>
                        {f}
                      </span>
                      <input type="radio" name="faculty" value={f} className="hidden" onChange={() => setActiveFaculty(f)} />
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground/80 mb-4 uppercase tracking-wider">Sắp xếp theo</h4>
                <Select options={sortOptions} value={sortBy} onChange={setSortBy} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 bg-card px-6 py-4 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">Giảng viên nổi bật</h2>
            </div>
            <span className="text-sm text-foreground/60 font-medium px-3 py-1 bg-background rounded-lg border border-border/50">
              {professors.length} kết quả
            </span>
          </div>

          {isLoading ? (
            <LoadingState message="Đang tải danh sách giảng viên..." />
          ) : isError ? (
            <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
          ) : professors.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-5">
              {professors.map((prof) => (
                <ProfessorCard key={prof.id} {...prof} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Không tìm thấy giảng viên nào"
              description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
            />
          )}
        </div>
      </div>
    </div>
  );
}
