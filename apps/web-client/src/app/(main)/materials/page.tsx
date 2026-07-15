'use client';

import React, { useState } from 'react';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { KnowledgeLegacy } from '@/components/materials/KnowledgeLegacy';
import { Search, Upload, Filter, Loader2, BookOpen, Library } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractList, errorMessage } from '@/lib/adapters';
import { LoadingState, EmptyState, ErrorState } from '@/components/shared/LoadingState';
import { SUBJECTS } from '@/components/materials/MaterialUploadForm';
import { MaterialUploadDialog } from '@/components/materials/MaterialUploadDialog';
import { AnimatePresence } from 'framer-motion';

const FILTERS = ['Tất cả', 'Bài giảng (PPTX)', 'Đề cương', 'Sách / Giáo trình', 'Đề thi cũ', 'Từ giảng viên'];

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['materials', activeFilter, searchQuery, selectedSubject],
    queryFn: async () => {
      const params: any = {};
      if (activeFilter !== 'Tất cả') params.type = activeFilter;
      if (searchQuery) params.search = searchQuery;
      if (selectedSubject) params.subject = selectedSubject;
      const response = await api.get('/materials', { params });
      return extractList(response);
    },
  });

  const materials = Array.isArray(data) ? data : [];

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      <AnimatePresence>
        {isUploadOpen && (
          <MaterialUploadDialog
            onClose={() => setIsUploadOpen(false)}
            onUploaded={() => queryClient.invalidateQueries({ queryKey: ['materials'] })}
          />
        )}
      </AnimatePresence>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-foreground mb-2 flex items-center gap-3"><Library className="w-8 h-8 text-primary" /> Kho Tài Liệu & AI</h1>
          <p className="text-foreground/60 text-[15px]">Tìm kiếm giáo trình, slide bài giảng và tài liệu ôn tập</p>
        </div>
        
        <button 
          onClick={() => setIsUploadOpen(true)} 
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all hover:scale-105 shrink-0 shadow-lg shadow-primary/20"
        >
          <Upload className="w-5 h-5" />
          Tải lên tài liệu
        </button>
      </div>

      <KnowledgeLegacy />

      {/* Advanced Search Area */}
      <div className="bg-card border border-border p-5 rounded-2xl mb-8 shadow-sm">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Tìm kiếm chi tiết
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tên tài liệu, từ khóa..." 
              className="w-full pl-11 pr-4 py-3 bg-hover border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
            />
          </div>
          
          <div className="md:col-span-5 relative">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-hover border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground appearance-none font-medium cursor-pointer"
            >
              <option value="">Tất cả môn học</option>
              {SUBJECTS.map(subj => (
                <option key={subj.id} value={subj.id}>{subj.id} - {subj.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button className="w-full h-full min-h-[48px] bg-hover border border-border rounded-xl hover:bg-hover/80 flex items-center justify-center gap-2 font-semibold text-foreground/80 transition-colors">
              <Filter className="w-5 h-5" />
              Lọc
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-2 scrollbar-hide pt-1">
          {FILTERS.map((filter) => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${ activeFilter === filter ? 'bg-primary text-white shadow-md' : 'bg-hover border border-border text-foreground/70 hover:bg-primary/10 hover:text-primary' }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <h2 className="text-lg font-bold text-foreground mb-4">Tài liệu mới nhất</h2>
      
      {isLoading ? (
        <LoadingState message="Đang tải tài liệu..." />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat: any) => (
            <MaterialCard 
              key={mat.id} 
              id={mat.id}
              title={mat.title || 'Tài liệu không tên'}
              type={mat.type || 'OTHER'}
              subject={mat.subject || 'Chưa phân loại'}
              semester={mat.semester || 'N/A'}
              uploaderName={mat.uploader?.fullName || 'Người dùng ẩn danh'}
              isLecturer={mat.uploader?.role === 'FACULTY'}
              downloadCount={mat.downloadCount || 0}
              viewCount={mat.viewCount || 0}
              likeCount={mat.bookmarkCount || 0}
              fileSizeKB={mat.fileSizeKB || 2048}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Chưa có tài liệu nào</h3>
          <p className="text-foreground/60 mb-6">
            {searchQuery || selectedSubject || activeFilter !== 'Tất cả' 
              ? 'Không tìm thấy tài liệu nào phù hợp với bộ lọc hiện tại.' 
              : 'Hãy là người đầu tiên chia sẻ tài liệu và nhận điểm thưởng Reputation!'}
          </p>
          <button 
            onClick={() => setIsUploadOpen(true)} 
            className="inline-flex px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Tải lên ngay
          </button>
        </div>
      )}
    </div>
  );
}
