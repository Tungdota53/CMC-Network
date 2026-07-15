'use client';

import { Avatar } from '@/components/ui/Avatar';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function YourGroupsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-groups'],
    queryFn: async () => {
      const response = await api.get('/study-groups/my');
      return response.data?.data || response.data || [];
    }
  });

  const groups = Array.isArray(data) ? data : [];

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center bg-card">
        <div>
          <h2 className="text-[17px] font-bold text-foreground">Nhóm bạn đã tham gia</h2>
          <p className="text-[13px] text-foreground/60 mt-0.5">
            {isLoading ? 'Đang tải...' : `Bạn đang tham gia ${groups.length} nhóm`}
          </p>
        </div>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : groups.length > 0 ? (
          groups.map((group: any) => (
            <div key={group.id} className="flex items-center gap-3 p-4 hover:bg-hover transition-colors cursor-pointer group">
              <div className="relative">
                <Avatar src={group.coverUrl || group.avatarUrl} fallback={(group.name || group.title || 'N').charAt(0)} size="lg" className="rounded-xl shadow-sm" />
                {group.unread > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-card">
                    {group.unread > 9 ? '9+' : group.unread}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[15px] text-foreground truncate group-hover:text-primary transition-colors">{group.name || group.title}</h3>
                <p className="text-[13px] text-foreground/60">Hoạt động lần cuối: Vừa xong</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-foreground/60 text-sm">
            Bạn chưa tham gia nhóm nào.
          </div>
        )}
        
        {groups.length > 0 && (
          <button className="w-full p-4 text-center text-[14px] font-medium text-primary hover:bg-hover transition-colors">
            Xem tất cả nhóm
          </button>
        )}
      </div>
    </div>
  );
}
