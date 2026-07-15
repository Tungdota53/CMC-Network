'use client';

import React, { useState } from 'react';
import { MentorCard } from '@/components/mentors/MentorCard';
import { Search, Filter, Calendar, GraduationCap, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useMentors } from '@/hooks/useMentors';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

const FILTERS = ['Tất cả', 'Lập trình', 'Toán học', 'Ngoại ngữ', 'Thiết kế', 'Kỹ năng mềm'];

export default function MentorsPage() {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError, error, refetch } = useMentors({
    expertise: activeFilter !== 'Tất cả' ? activeFilter : undefined,
  });

  const mentors = Array.isArray(data) ? data : [];

  // Client-side search by name/expertise
  const filtered = searchQuery
    ? mentors.filter(
        (m) =>
          m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.expertise?.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : mentors;

  return (
    <div className="max-w-[1200px] w-full pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-foreground mb-2 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" /> Mentor Connect
          </h1>
          <p className="text-foreground/60">Tìm kiếm và đặt lịch học 1-1 với những Mentor xuất sắc nhất</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/mentors/register" className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shrink-0 shadow-sm">
            <UserPlus className="w-5 h-5" />
            Đăng ký làm mentor
          </Link>
          <Link href="/mentors/my-sessions" className="px-5 py-2.5 bg-card border border-border text-foreground/80 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-hover transition-colors shrink-0 shadow-sm">
            <Calendar className="w-5 h-5" />
            Lịch học của tôi
          </Link>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên, kỹ năng (VD: Java, React)..."
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-foreground placeholder:text-foreground/40"
          />
        </div>
        <button className="px-4 py-3 bg-card border border-border rounded-xl hover:bg-hover flex items-center gap-2 font-medium text-foreground/80 transition-colors shadow-sm">
          <Filter className="w-5 h-5" />
          Lọc kết quả
        </button>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeFilter === filter ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-card border border-border text-foreground/70 hover:bg-hover'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải danh sách mentor..." />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((mentor) => (
            <MentorCard key={mentor.id} {...mentor} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không tìm thấy Mentor nào"
          description={searchQuery || activeFilter !== 'Tất cả'
            ? 'Không có Mentor phù hợp với bộ lọc. Thử thay đổi từ khóa.'
            : 'Chưa có Mentor nào đăng ký. Hãy quay lại sau!'}
        />
      )}
    </div>
  );
}
