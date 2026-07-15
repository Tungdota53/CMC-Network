'use client';

import React from 'react';
import { Phone, Video, PhoneMissed, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const CallHistory = () => {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['chat', 'calls', 'history'],
    queryFn: async () => {
      try {
        const res = await api.get('/chat/calls/history');
        return res.data?.data?.items || res.data?.items || res.data || [];
      } catch (e) {
        return [];
      }
    }
  });

  const history = Array.isArray(historyData) ? historyData : [];

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden w-full max-w-md">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Lịch sử cuộc gọi</h3>
        <button className="text-sm text-primary font-medium hover:underline">Xóa tất cả</button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-foreground/50 text-sm">
          Chưa có lịch sử cuộc gọi
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {history.map((call: any) => (
            <div key={call.id} className="flex items-center gap-3 p-3 hover:bg-hover transition-colors cursor-pointer">
              <Avatar size="md" fallback={call.name?.charAt(0)} />
              <div className="flex-1 min-w-0">
                <h4 className={`text-[15px] font-semibold truncate ${call.status === 'missed' ? 'text-red-500' : 'text-foreground'}`}>
                  {call.name}
                </h4>
                <div className="flex items-center gap-1.5 text-[13px] text-foreground/50 mt-0.5">
                  {call.status === 'missed' && <PhoneMissed className="w-3.5 h-3.5 text-red-500" />}
                  {call.status === 'outgoing' && <Phone className="w-3.5 h-3.5 rotate-45" />}
                  {call.status === 'incoming' && <Phone className="w-3.5 h-3.5" />}
                  <span>{call.time}</span>
                </div>
              </div>
              <button className="w-10 h-10 rounded-full bg-hover hover:bg-foreground/5 flex items-center justify-center transition-colors border border-transparent hover:border-border">
                {call.type === 'video' ? <Video className="w-5 h-5 text-foreground/70" /> : <Phone className="w-5 h-5 text-foreground/70" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
