'use client';

import React, { useState } from 'react';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { KnowledgeLegacy } from '@/components/materials/KnowledgeLegacy';
import { Search, Upload, BookOpen, Library, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractList, errorMessage } from '@/lib/adapters';
import { LoadingState, ErrorState } from '@/components/shared/LoadingState';
import { MaterialUploadDialog } from '@/components/materials/MaterialUploadDialog';
import { AnimatePresence } from 'framer-motion';
import { toMaterialViewModel, type MaterialApiItem, type MaterialFileType } from '@/components/materials/materialViewModel';

const FILE_FILTERS: Array<{ label: string; value: '' | MaterialFileType }> = [
  { label: 'Tất cả', value: '' },
  { label: 'PDF', value: 'PDF' },
  { label: 'Word', value: 'DOCX' },
  { label: 'PowerPoint', value: 'PPTX' },
  { label: 'Excel', value: 'XLSX' },
  { label: 'Tệp nén', value: 'ZIP' },
];

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const [activeFileType, setActiveFileType] = useState<'' | MaterialFileType>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['materials', activeFileType, searchQuery, selectedSubject],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (activeFileType) params.fileType = activeFileType;
      if (searchQuery) params.search = searchQuery;
      if (selectedSubject) params.subject = selectedSubject;
      const response = await api.get('/materials', { params });
      return extractList<MaterialApiItem>(response).map(toMaterialViewModel);
    },
  });

  const materials = Array.isArray(data) ? data : [];

  return (
    <main className="mx-auto w-full max-w-[1180px] animate-in fade-in px-4 pb-20 pt-6 duration-300 sm:px-6">
      <AnimatePresence>
        {isUploadOpen && (
          <MaterialUploadDialog
            onClose={() => setIsUploadOpen(false)}
            onUploaded={() => queryClient.invalidateQueries({ queryKey: ['materials'] })}
          />
        )}
      </AnimatePresence>
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-7 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Thư viện học thuật</p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground"><Library className="h-8 w-8 text-primary" /> Kho tài liệu CMC</h1>
          <p className="mt-2 text-[15px] text-foreground/60">Tìm kiếm và chia sẻ giáo trình, slide bài giảng, đề thi và tài liệu ôn tập.</p>
        </div>
        
        <button 
          onClick={() => setIsUploadOpen(true)} 
          className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Upload className="w-5 h-5" />
          Tải lên tài liệu
        </button>
      </header>

      <KnowledgeLegacy />

      {/* Advanced Search Area */}
      <section aria-label="Bộ lọc tài liệu" className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-7">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mô tả hoặc từ khóa..."
              aria-label="Tìm kiếm tài liệu"
              className="min-h-12 w-full rounded-xl border border-border bg-background py-3 pl-11 pr-10 text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Xóa từ khóa" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-foreground/45 hover:bg-hover"><X className="h-4 w-4" /></button>}
          </div>
          
          <div className="relative md:col-span-5">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              placeholder="Môn học hoặc mã môn"
              aria-label="Lọc theo môn học"
              className="min-h-12 w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-2 scrollbar-hide pt-1">
          {FILE_FILTERS.map((filter) => (
            <button 
              key={filter.label}
              onClick={() => setActiveFileType(filter.value)}
              aria-pressed={activeFileType === filter.value}
              className={`min-h-10 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${ activeFileType === filter.value ? 'bg-primary text-white' : 'border border-border bg-background text-foreground/70 hover:border-primary/40 hover:text-primary' }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <h2 className="text-lg font-bold text-foreground mb-4">Tài liệu mới nhất</h2>
      
      {isLoading ? (
        <LoadingState message="Đang tải tài liệu..." />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <MaterialCard key={mat.id} material={mat} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Chưa có tài liệu nào</h3>
          <p className="text-foreground/60 mb-6">
            {searchQuery || selectedSubject || activeFileType
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
    </main>
  );
}
