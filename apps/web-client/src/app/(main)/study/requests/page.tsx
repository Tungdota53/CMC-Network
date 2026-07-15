'use client';

import React, { useState } from 'react';
import { StudyRequestCard } from '@/components/study/StudyRequestCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/shared/LoadingState';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { useStudyRequests } from '@/hooks/useStudyGroups';

export default function StudyRequestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const { data: requests, isLoading, isError, error, refetch } = useStudyRequests();

  const filtered = (requests || []).filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.title?.toLowerCase().includes(q) && !r.subject?.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-foreground mb-2">Bảng Tin Yêu Cầu</h1>
          <p className="text-foreground/60">Tìm kiếm bạn đồng hành hoặc Mentor hướng dẫn</p>
        </div>
        
        <Link href="/study/requests/create" className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shrink-0">
          <Plus className="w-5 h-5" />
          Đăng yêu cầu
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo môn học, kỹ năng..." 
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-foreground/40 shadow-sm"
          />
        </div>
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-foreground min-w-[180px] shadow-sm"
        >
          <option value="ALL">Tất cả yêu cầu</option>
          <option value="FIND_PARTNER">Tìm bạn học</option>
          <option value="FIND_GROUP">Tìm nhóm ghép</option>
          <option value="FIND_TUTOR">Tìm Mentor/Gia sư</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải yêu cầu..." />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Chưa có yêu cầu nào"
          description="Hãy đăng yêu cầu đầu tiên để tìm bạn học cùng."
          action={<Link href="/study/requests/create" className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Đăng yêu cầu</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((req) => (
            <StudyRequestCard key={req.id} {...req} />
          ))}
        </div>
      )}
    </div>
  );
}
