'use client';

import React from 'react';
import { MaterialCard } from './MaterialCard';
import { Sparkles, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const KnowledgeLegacy = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['legacy-materials'],
    queryFn: async () => {
      const response = await api.get('/materials/legacy/recommendations');
      return response.data?.data || response.data || [];
    }
  });

  const materials = Array.isArray(data) ? data : [];

  if (!isLoading && materials.length === 0) {
    return null; // Don't show the section if there are no legacy recommendations
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Di sản tri thức</h2>
      </div>
      <p className="text-gray-600 mb-6">Tài liệu kinh điển được các khóa trước đánh giá cao nhất</p>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((item: any) => (
            <MaterialCard key={item.id} {...item} />
          ))}
        </div>
      )}
    </div>
  );
};
