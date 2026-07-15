import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, BookOpen, User, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export const AddEntryForm = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', classCode: '', room: '', lecturer: '', dayOfWeek: '0', startTime: '07:00', endTime: '09:00' });
  const createEntry = useMutation({
    mutationFn: async () => api.post('/timetable/events', { ...form, dayOfWeek: Number(form.dayOfWeek) }),
    onSuccess: () => {
      toast.success('Đã thêm lịch học');
      queryClient.invalidateQueries({ queryKey: ['timetable', 'events'] });
      setForm({ title: '', classCode: '', room: '', lecturer: '', dayOfWeek: '0', startTime: '07:00', endTime: '09:00' });
    },
    onError: () => toast.error('Không thể thêm lịch học'),
  });

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((value) => ({ ...value, [key]: event.target.value }));

  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
      <h3 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-4">Thêm lịch học</h3>
      
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); createEntry.mutate(); }}>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
            <BookOpen className="w-4 h-4 text-foreground/40" /> Tên môn học
          </label>
          <input value={form.title} onChange={update('title')} required type="text" placeholder="VD: Giải tích 1..." className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
            <Clock className="w-4 h-4 text-foreground/40" /> Thứ
          </label>
          <select value={form.dayOfWeek} onChange={update('dayOfWeek')} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground">
            {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day, index) => <option key={day} value={index}>{day}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
              <Tag className="w-4 h-4 text-foreground/40" /> Mã lớp
            </label>
            <input value={form.classCode} onChange={update('classCode')} type="text" placeholder="VD: MA001.P11" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
              <MapPin className="w-4 h-4 text-foreground/40" /> Phòng học
            </label>
            <input value={form.room} onChange={update('room')} type="text" placeholder="VD: B1.06" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
            <User className="w-4 h-4 text-foreground/40" /> Giảng viên
          </label>
          <input value={form.lecturer} onChange={update('lecturer')} type="text" placeholder="Tên giảng viên..." className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
              <Clock className="w-4 h-4 text-foreground/40" /> Bắt đầu
            </label>
            <input value={form.startTime} onChange={update('startTime')} type="time" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-2">
              <Clock className="w-4 h-4 text-foreground/40" /> Kết thúc
            </label>
            <input value={form.endTime} onChange={update('endTime')} type="time" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground" />
          </div>
        </div>

        <button disabled={createEntry.isPending} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors mt-2 shadow-sm disabled:opacity-60">
          {createEntry.isPending ? 'Đang thêm...' : 'Thêm vào lịch'}
        </button>
      </form>
    </div>
  );
};
