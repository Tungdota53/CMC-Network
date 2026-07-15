'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { Bookmark, Loader2, FileText, Download, Star, Trash2 } from 'lucide-react';

export default function BookmarksPage() {
  const qc = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['material-bookmarks'],
    queryFn: async () => {
      const res = await api.get('/materials/bookmarks');
      return res.data.data;
    },
  });

  const removeBookmark = useMutation({
    mutationFn: async (materialId: string) => {
      return api.post(`/materials/${materialId}/bookmark`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-bookmarks'] });
    },
  });

  const materials = Array.isArray(bookmarks) ? bookmarks : [];

  return (
    <div className="max-w-[900px] w-full pb-20 pt-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-primary" /> Tài liệu đã lưu
        </h1>
        <p className="text-gray-500 text-sm">{materials.length} tài liệu</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Bookmark className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Chưa có tài liệu nào được lưu</p>
          <Link href="/materials" className="mt-4 text-primary font-medium hover:underline">
            Khám phá tài liệu
          </Link>
        </div>
      )}

      {!isLoading && materials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((m: any) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/materials/${m.id}`} className="font-bold text-gray-900 hover:text-primary line-clamp-1">
                    {m.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">{m.subject || ''} · {m.materialType || ''}</p>
                </div>
                <button
                  onClick={() => removeBookmark.mutate(m.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Bỏ lưu"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {m.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{m.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                {m.downloadCount != null && (
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" /> {m.downloadCount}
                  </span>
                )}
                {m.rating != null && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {m.rating.toFixed(1)}
                  </span>
                )}
                <span>{new Date(m.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
