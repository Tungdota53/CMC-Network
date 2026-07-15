'use client';

import { GroupCard } from './GroupCard';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function SuggestedGroups() {
  const { data, isLoading } = useQuery({
    queryKey: ['suggested-groups'],
    queryFn: async () => {
      const response = await api.get('/study-groups/suggestions');
      return response.data?.data || response.data || [];
    }
  });

  const groups = Array.isArray(data) ? data : [];

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-bold text-foreground">Gợi ý cho bạn</h2>
          <p className="text-[13px] text-foreground/60 mt-0.5">Các nhóm có thể bạn sẽ thích tham gia</p>
        </div>
        <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          Xem tất cả
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {groups.map((group: any) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-foreground/60 text-sm">
          Không có nhóm gợi ý nào lúc này.
        </div>
      )}
    </div>
  );
}
