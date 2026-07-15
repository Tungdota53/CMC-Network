'use client';

import React, { useState } from 'react';
import { EventCard } from '@/components/events/EventCard';
import { Calendar, List } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

const CATEGORY_TABS = ['Tất cả', 'Học thuật', 'Thể thao', 'Văn hóa', 'Công nghệ', 'Giao lưu'];
const CAT_VALUES = ['', 'ACADEMIC', 'SPORTS', 'CULTURAL', 'TECH', 'SOCIAL'];

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long' });
}

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const { data, isLoading, isError, error, refetch } = useEvents();

  const cat = CAT_VALUES[activeCategory];
  const events = (Array.isArray(data) ? data : []).filter((event) => !cat || event.type === cat);
  const grouped = events.reduce<Record<string, typeof events>>((acc, event) => {
    const key = formatDay(event.startDate);
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <div className="max-w-[1100px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-foreground mb-1 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" /> Sự kiện
          </h1>
          <p className="text-foreground/60">Khám phá và đăng ký tham gia các sự kiện tại CMC Campus</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setView('list')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${view === 'list' ? 'bg-primary text-white border-primary' : 'bg-card border-border text-foreground/70 hover:bg-hover'}`}>
          <List className="w-4 h-4" /> Danh sách
        </button>
        <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${view === 'calendar' ? 'bg-primary text-white border-primary' : 'bg-card border-border text-foreground/70 hover:bg-hover'}`}>
          <Calendar className="w-4 h-4" /> Lịch
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORY_TABS.map((catName, i) => (
          <button 
            key={catName} 
            onClick={() => setActiveCategory(i)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${ activeCategory === i ? 'bg-primary text-white border-primary' : 'bg-card text-foreground/70 border-border hover:border-primary/50 hover:text-primary' }`}
          >
            {catName}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải sự kiện..." />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : events.length > 0 ? (
        view === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {events.map((event) => <EventCard key={event.id} {...event} />)}
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([day, dayEvents]) => (
              <section key={day} className="bg-card rounded-2xl border border-border p-5">
                <h2 className="font-extrabold text-foreground mb-4 capitalize">{day}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dayEvents.map((event) => <EventCard key={event.id} {...event} />)}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
        <EmptyState title="Không có sự kiện" description="Không có sự kiện nào trong mục này." />
      )}
    </div>
  );
}
