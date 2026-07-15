'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractList } from '@/lib/adapters';
import { Loader2, Trash2 } from 'lucide-react';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const TIME_SLOTS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const PX_PER_MIN = 80 / 60; // 80px per hour
const BASE_HOUR = 7; // 07:00 = 0px

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function eventPosition(startTime: string, endTime: string) {
  const startMin = timeToMinutes(startTime) - BASE_HOUR * 60;
  const endMin = timeToMinutes(endTime) - BASE_HOUR * 60;
  return {
    top: Math.max(0, startMin * PX_PER_MIN),
    height: Math.max(40, (endMin - startMin) * PX_PER_MIN),
  };
}

export const WeekView = ({ onSelectEvent }: { onSelectEvent?: (event: any) => void }) => {
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useQuery({
    queryKey: ['timetable', 'events'],
    queryFn: async () => {
      const res = await api.get('/timetable/events');
      return extractList<any>(res);
    },
  });

  const eventList = Array.isArray(events) ? events : [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/timetable/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timetable', 'events'] }),
  });

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="grid grid-cols-8 border-b border-border bg-hover/50">
        <div className="p-3 text-center text-sm font-semibold text-foreground/50 border-r border-border">
          Thời gian
        </div>
        {DAYS.map(day => (
          <div key={day} className="p-3 text-center text-sm font-bold text-foreground/80 border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="relative h-[800px] overflow-y-auto">
        <div className="grid grid-cols-8 relative min-w-[700px]">
          {/* Time Column */}
          <div className="border-r border-border bg-hover/50">
            {TIME_SLOTS.map(time => (
              <div key={time} className="h-20 border-b border-border p-2 text-xs font-semibold text-foreground/50 text-center">
                {time}
              </div>
            ))}
          </div>

          {/* Grid columns */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="border-r border-border last:border-r-0 relative">
              {TIME_SLOTS.map(time => (
                <div key={time} className="h-20 border-b border-border/50 hover:bg-hover transition-colors" />
              ))}
              
              {/* Dynamic event items */}
              {isLoading ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                   <Loader2 className="w-5 h-5 animate-spin text-primary opacity-50" />
                 </div>
              ) : (
                eventList.filter((e: any) => (e.dayOfWeek ?? DAYS.indexOf(e.day ?? '')) === dayIdx).map((e: any) => {
                  const pos = eventPosition(e.startTime, e.endTime);
                  return (
                  <button key={e.id} onClick={() => onSelectEvent?.(e)} className="absolute left-1 right-1 bg-primary/10 border-l-4 border-primary rounded-md p-2 text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left group"
                       style={{ top: `${pos.top}px`, height: `${pos.height}px` }}>
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-bold text-primary truncate">{e.title}</div>
                      <span onClick={(event) => { event.stopPropagation(); deleteMutation.mutate(e.id); }} className="opacity-0 group-hover:opacity-100 text-primary/50 hover:text-red-500 transition-all" role="button" aria-label="Xóa lịch học">
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="text-primary/80 mt-0.5">{e.location || e.room || 'Chưa có phòng'}</div>
                    <div className="text-primary/70 mt-0.5 font-medium">{e.startTime}–{e.endTime}</div>
                    {e.classCode && <div className="text-primary/60 mt-0.5 truncate">{e.classCode}</div>}
                  </button>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
