'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import api from '@/lib/api';

const DAYS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const TodayWidget = () => {
  const today = DAYS[new Date().getDay()];
  const { data } = useQuery({
    queryKey: ['timetable', 'events'],
    queryFn: async () => {
      const res = await api.get('/timetable/events');
      return res.data?.data?.items || res.data?.items || res.data || [];
    },
  });
  const events = (Array.isArray(data) ? data : []).filter((event: any) => event.day === today);

  return (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm mb-6">
      <h4 className="font-bold text-foreground mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Hôm nay</h4>
      {events.length === 0 ? <p className="text-sm text-foreground/50">Không có lịch học hôm nay.</p> : (
        <div className="space-y-2">
          {events.slice(0, 3).map((event: any) => <div key={event.id} className="rounded-xl bg-primary/5 p-3 text-sm"><p className="font-bold text-foreground">{event.title}</p><p className="text-xs text-foreground/60">{event.time} · {event.room || 'Chưa có phòng'}</p></div>)}
        </div>
      )}
    </div>
  );
};
