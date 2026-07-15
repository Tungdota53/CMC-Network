'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Clock, MapPin, BookOpen, User, Tag, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { extractList } from '@/lib/adapters';

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

interface EditEntryDialogProps {
  event: TimetableEvent | null;
  onClose: () => void;
}

export function EditEntryDialog({ event, onClose }: EditEntryDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    classCode: '',
    room: '',
    lecturer: '',
    dayOfWeek: 0,
    startTime: '07:00',
    endTime: '09:00',
  });

  // Fetch all events for conflict detection
  const { data: allEvents } = useQuery({
    queryKey: ['timetable', 'events'],
    queryFn: async () => {
      const res = await api.get('/timetable/events');
      return extractList<TimetableEvent>(res);
    },
  });

  useEffect(() => {
    if (event) {
      const dayNum = event.dayOfWeek ?? DAYS.indexOf(event.day ?? '') ?? 0;
      setForm({
        title: event.title || '',
        classCode: event.classCode || '',
        room: event.room || '',
        lecturer: event.lecturer || '',
        dayOfWeek: dayNum >= 0 ? dayNum : 0,
        startTime: event.startTime || '07:00',
        endTime: event.endTime || '09:00',
      });
    }
  }, [event]);

  // Conflict detection
  const conflicts = useMemo(() => {
    if (!event || !allEvents) return [];
    const eventList = Array.isArray(allEvents) ? allEvents : [];
    return eventList.filter((e: TimetableEvent) => {
      if (e.id === event.id) return false;
      if (e.dayOfWeek !== form.dayOfWeek) return false;
      // Time overlap
      return form.startTime < e.endTime && form.endTime > e.startTime;
    });
  }, [event, allEvents, form.dayOfWeek, form.startTime, form.endTime]);

  const hasConflict = conflicts.length > 0;
  const timeError = form.startTime >= form.endTime;

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/timetable/events/${event!.id}`, { ...form, dayOfWeek: Number(form.dayOfWeek) });
    },
    onSuccess: () => {
      toast.success('Đã cập nhật lịch học');
      queryClient.invalidateQueries({ queryKey: ['timetable', 'events'] });
      onClose();
    },
    onError: () => toast.error('Không thể cập nhật lịch học'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/timetable/events/${event!.id}`);
    },
    onSuccess: () => {
      toast.success('Đã xóa lịch học');
      queryClient.invalidateQueries({ queryKey: ['timetable', 'events'] });
      onClose();
    },
    onError: () => toast.error('Không thể xóa lịch học'),
  });

  if (!event) return null;

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((v) => ({ ...v, [key]: key === 'dayOfWeek' ? Number(e.target.value) : e.target.value }));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-foreground">Sửa lịch học</h3>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (hasConflict || timeError) return;
            updateMutation.mutate();
          }}
        >
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
              <BookOpen className="w-4 h-4 text-foreground/40" /> Tên môn học
            </label>
            <input value={form.title} onChange={update('title')} required type="text"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
              <Clock className="w-4 h-4 text-foreground/40" /> Thứ
            </label>
            <select value={form.dayOfWeek} onChange={update('dayOfWeek')}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground">
              {DAYS.map((day, i) => <option key={day} value={i}>{day}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
                <Tag className="w-4 h-4 text-foreground/40" /> Mã lớp
              </label>
              <input value={form.classCode} onChange={update('classCode')} type="text"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
                <MapPin className="w-4 h-4 text-foreground/40" /> Phòng học
              </label>
              <input value={form.room} onChange={update('room')} type="text"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
              <User className="w-4 h-4 text-foreground/40" /> Giảng viên
            </label>
            <input value={form.lecturer} onChange={update('lecturer')} type="text"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
                <Clock className="w-4 h-4 text-foreground/40" /> Bắt đầu
              </label>
              <input value={form.startTime} onChange={update('startTime')} type="time"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
                <Clock className="w-4 h-4 text-foreground/40" /> Kết thúc
              </label>
              <input value={form.endTime} onChange={update('endTime')} type="time"
                className={`w-full px-4 py-2.5 bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${timeError ? 'border-red-500' : 'border-border focus:border-primary'}`} />
            </div>
          </div>

          {/* Time error */}
          {timeError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertTriangle className="w-4 h-4" /> Giờ kết thúc phải sau giờ bắt đầu
            </div>
          )}

          {/* Conflict preview */}
          {hasConflict && !timeError && (
            <div className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-4">
              <div className="flex items-center gap-2 font-bold text-orange-600 dark:text-orange-400 mb-2">
                <AlertTriangle className="w-4 h-4" /> Xung đột lịch — {conflicts.length} môn trùng giờ
              </div>
              <div className="space-y-1.5">
                {conflicts.map((c: TimetableEvent) => (
                  <div key={c.id} className="text-sm text-foreground/70 flex items-center gap-2">
                    <span className="font-semibold">{c.title}</span>
                    <span className="text-xs text-foreground/50">{c.startTime}–{c.endTime}</span>
                    {c.room && <span className="text-xs text-foreground/50">· {c.room}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" /> Xóa
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-hover font-bold text-sm text-foreground">Hủy</button>
              <button
                type="submit"
                disabled={updateMutation.isPending || hasConflict || timeError}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}