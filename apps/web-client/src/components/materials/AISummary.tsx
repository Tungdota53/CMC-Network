'use client';

import React from 'react';
import { Sparkles, Loader2, FileCheck2, FileWarning } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const AISummary = ({ materialId }: { materialId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['material-summary', materialId],
    queryFn: async () => {
      const res = await api.get(`/materials/${materialId}`);
      const material = res.data?.data || res.data;
      return material ? { summary: material.aiSummary, source: material.aiContentSource } : null;
    },
    enabled: Boolean(materialId),
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6 flex items-center justify-center min-h-[150px]">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data?.summary) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20" aria-labelledby="ai-summary-unavailable-title">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
            <FileWarning className="h-4 w-4" />
          </div>
          <div>
            <h2 id="ai-summary-unavailable-title" className="font-bold text-foreground">Chưa thể đọc nội dung PDF</h2>
            <p className="mt-1 text-sm leading-6 text-foreground/65">
              File có thể dùng font mã hóa hoặc chỉ chứa ảnh. AI sẽ không tạo tóm tắt, flashcard hay câu hỏi khi chưa trích xuất được văn bản đáng tin cậy.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-primary/20 bg-card p-5 shadow-sm" aria-labelledby="ai-summary-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h2 id="ai-summary-title" className="text-base font-bold text-foreground">AI đã đọc tài liệu</h2>
          <p className="text-xs text-foreground/60">Tóm tắt tập trung vào nội dung trong file</p>
        </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <FileCheck2 className="h-3.5 w-3.5" />
          {data.source === 'document' ? 'Đã phân tích file' : 'Bản tóm tắt cơ bản'}
        </span>
      </div>
      <div className="prose prose-sm dark:prose-invert text-foreground/80">
        <p className="whitespace-pre-wrap leading-7">{data.summary}</p>
      </div>
    </section>
  );
};
