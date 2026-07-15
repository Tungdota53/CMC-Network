'use client';

import React from 'react';
import { WeekView } from '@/components/timetable/WeekView';
import { DayView } from '@/components/timetable/DayView';
import { AddEntryForm } from '@/components/timetable/AddEntryForm';
import { BulkImportDialog } from '@/components/timetable/BulkImportDialog';
import { ClassmatesList } from '@/components/timetable/ClassmatesList';
import { FreeSlotComparison } from '@/components/timetable/FreeSlotComparison';
import { TodayWidget } from '@/components/timetable/TodayWidget';
import { EditEntryDialog } from '@/components/timetable/EditEntryDialog';
import { Calendar, Users } from 'lucide-react';

export default function TimetablePage() {
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);

  return (
    <div className="max-w-[1200px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-foreground mb-2 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Lịch học thông minh
          </h1>
          <p className="text-foreground/60">Quản lý thời khóa biểu, đối chiếu giờ rảnh và tìm bạn cùng lớp</p>
        </div>
        
        <div className="flex gap-3">
          <BulkImportDialog />
          <button className="px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors text-sm">
            <Users className="w-4 h-4" /> So sánh giờ rảnh
          </button>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {/* Mobile: day view */}
          <div className="md:hidden">
            <DayView onSelectEvent={setSelectedEvent} />
          </div>
          {/* Desktop: week view */}
          <div className="hidden md:block">
            <WeekView onSelectEvent={setSelectedEvent} />
          </div>
          <FreeSlotComparison />
        </div>
        <div>
          <TodayWidget />
          <AddEntryForm />
          <ClassmatesList classCode={selectedEvent?.classCode} />
        </div>
      </div>

      <EditEntryDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
