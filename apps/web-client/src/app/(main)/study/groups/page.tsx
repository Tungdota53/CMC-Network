'use client';

import React, { useState } from 'react';
import { StudyGroupCard } from '@/components/study/StudyGroupCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/shared/LoadingState';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { useStudyGroups } from '@/hooks/useStudyGroups';

export default function StudyGroupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: groups, isLoading, isError, error, refetch } = useStudyGroups();

  const filtered = (groups || []).filter((g) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!g.title?.toLowerCase().includes(q) && !g.subject?.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== 'ALL' && g.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-foreground mb-2">Danh Sách Nhóm Học</h1>
          <p className="text-foreground/60">Tham gia các nhóm học tập để cải thiện kết quả</p>
        </div>
        
        <Link href="/study/groups/create" className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shrink-0">
          <Plus className="w-5 h-5" />
          Tạo nhóm
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên môn học, tiêu đề nhóm..." 
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-foreground/40 shadow-sm"
          />
        </div>
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-foreground min-w-[150px] shadow-sm"
        >
          <option value="ALL">Tất cả loại</option>
          <option value="STUDY">Học tập</option>
          <option value="PROJECT">Đồ án</option>
          <option value="RESEARCH">Nghiên cứu</option>
          <option value="EXAM_PREP">Ôn thi</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-foreground min-w-[150px] shadow-sm"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="OPEN">Đang tuyển</option>
          <option value="FULL">Đã đủ</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải danh sách nhóm..." />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Chưa có nhóm học nào"
          description="Hãy tạo nhóm đầu tiên để bắt đầu học tập cùng bạn bè."
          action={<Link href="/study/groups/create" className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Tạo nhóm</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((group) => (
            <StudyGroupCard key={group.id} {...group} />
          ))}
        </div>
      )}
    </div>
  );
}
