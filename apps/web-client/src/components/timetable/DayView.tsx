'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractList } from '@/lib/adapters';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

interface TimetableEvent {
  id: string;
  title: string;
  classCode?: string;
  room?: string;
  lecturer?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  day?: string;
}

export function DayView({ onSelectEvent }: { onSelectEvent?: (e: TimetableEvent) => void }) {
  const [selectedDay, setSelectedDay] = useState(0);

  const { data: events, isLoading } = useQuery({
    queryKey: ['timetable', 'events'],
    queryFn: async () => {
      const res = await api.get('/timetable/events');
      return extractList<TimetableEvent>(res);
    },
  });

  const eventList = Array.isArray(events) ? events : [];
  const dayEvents = eventList
    .filter((e: TimetableEvent) => e.dayOfWeek === selectedDay)
    .sort((a: TimetableEvent, b: TimetableEvent) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm md:hidden">
      {/* Day selector */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <button
          onClick={() => setSelectedDay((d) => (d - 1 + 7) % 7)}
          className="p-2 rounded-lg hover:bg-hover transition-colors"
          aria-label="Ngày trước"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/60" />
        </button>
        <span className="font-bold text-foreground">{DAYS[selectedDay]}</span>
        <button
          onClick={() => setSelectedDay((d) => (d + 1) % 7)}
          className="p-2 rounded-lg hover:bg-hover transition-colors"
          aria-label="Ngày sau"
        >
          <ChevronRight className="w-5 h-5 text-foreground/60" />
        </button>
      </div>

      {/* Day dots */}
      <div className="flex justify-center gap-1.5 pb-3">
        {DAYS.map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === selectedDay ? 'bg-primary' : 'bg-border'}`}
            aria-label={`Chọn ${DAYS[i]}`}
          />
        ))}
      </div>

      {/* Events list */}
      <div className="p-4 space-y-3 min-h-[200px]">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : dayEvents.length === 0 ? (
          <div className="text-center py-8 text-foreground/40 text-sm">Không có lịch học</div>
        ) : (
          dayEvents.map((e: TimetableEvent) => (
            <button
              key={e.id}
              onClick={() => onSelectEvent?.(e)}
              className="w-full text-left bg-primary/5 border-l-4 border-primary rounded-lg p-3 hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-xs font-semibold text-primary/80">{e.startTime} – {e.endTime}</span>
              </div>
              <div className="font-bold text-foreground text-sm">{e.title}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-foreground/50">
                {e.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.room}</span>}
                {e.classCode && <span>{e.classCode}</span>}
              </div>
              {e.lecturer && <div className="text-xs text-foreground/40 mt-0.5">{e.lecturer}</div>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
