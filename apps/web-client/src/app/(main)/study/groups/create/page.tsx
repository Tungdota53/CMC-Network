'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { ArrowLeft, Loader2, Users, MapPin, Clock, BookOpen } from 'lucide-react';

const GROUP_TYPES = [
  { value: 'STUDY', label: 'Học nhóm' },
  { value: 'PROJECT', label: 'Làm dự án' },
  { value: 'RESEARCH', label: 'Nghiên cứu' },
];

export default function CreateStudyGroupPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    title: '',
    subject: '',
    description: '',
    location: '',
    maxMembers: 10,
    scheduledTime: '',
    schedule: '',
    type: 'STUDY',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        creatorId: user?.id,
        maxMembers: Number(form.maxMembers),
        scheduledTime: form.scheduledTime ? new Date(form.scheduledTime).toISOString() : undefined,
      };
      const res = await api.post('/study-groups', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      router.push(`/study/groups/${data.id}`);
    },
    onError: (err: any) => alert(err?.message || 'Tạo nhóm thất bại'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.subject || !form.location) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="max-w-[700px] w-full pb-20 pt-6 px-4">
      <Link href="/study/groups" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-semibold text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách nhóm
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo nhóm học mới</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên nhóm *</label>
          <input
            type="text" required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="VD: Ôn thi Giải tích 1"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Môn học *</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" required value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="VD: MA001"
                className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại nhóm</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700">
              {GROUP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả</label>
          <textarea rows={3} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả mục tiêu và nội dung học..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Địa điểm *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" required value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="VD: Phòng A101"
                className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số thành viên tối đa</label>
            <div className="relative">
              <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="number" min={2} max={50} value={form.maxMembers}
                onChange={e => setForm({ ...form, maxMembers: Number(e.target.value) })}
                className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thời gian dự kiến</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="datetime-local" value={form.scheduledTime}
                onChange={e => setForm({ ...form, scheduledTime: e.target.value })}
                className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lịch trình</label>
            <input type="text" value={form.schedule}
              onChange={e => setForm({ ...form, schedule: e.target.value })}
              placeholder="VD: T2, T4, T6 (19:00-21:00)"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
            />
          </div>
        </div>

        <button type="submit" disabled={createMutation.isPending}
          className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tạo nhóm'}
        </button>
      </form>
    </div>
  );
}
