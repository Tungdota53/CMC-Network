'use client';

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const AISummary = ({ materialId }: { materialId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['material-summary', materialId],
    queryFn: async () => {
      const res = await api.get(`/materials/${materialId}`);
      return res.data?.data?.aiSummary || res.data?.aiSummary || null;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6 flex items-center justify-center min-h-[150px]">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="text-[16px] font-bold text-foreground">AI Tóm Tắt Nhanh</h3>
      </div>
      <div className="prose prose-sm dark:prose-invert text-foreground/80">
        <p className="whitespace-pre-wrap leading-relaxed">{data}</p>
      </div>
    </div>
  );
};
