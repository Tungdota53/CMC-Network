'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react';
import api from '@/lib/api';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const SLOTS = ['07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00', '19:00-21:00'];

const minutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + (minute || 0);
};

export const FreeSlotComparison = () => {
  const { data } = useQuery({
    queryKey: ['timetable', 'events'],
    queryFn: async () => {
      const res = await api.get('/timetable/events');
      return res.data?.data?.items || res.data?.items || res.data || [];
    },
  });
  const events = Array.isArray(data) ? data : [];
  const freeSlots = DAYS.flatMap((day) => SLOTS.map((slot) => ({ day, slot }))).filter(({ day, slot }) => {
    const [start, end] = slot.split('-');
    return !events.some((event: any) => event.day === day && minutes(start) < minutes(event.endTime) && minutes(event.startTime) < minutes(end));
  }).slice(0, 8);

  return (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm mt-6">
      <h4 className="font-bold text-foreground mb-3 flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary" /> Gợi ý giờ rảnh</h4>
      <div className="grid grid-cols-2 gap-2">
        {freeSlots.map((item) => <div key={`${item.day}-${item.slot}`} className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-600">{item.day}<br />{item.slot}</div>)}
      </div>
    </div>
  );
};
