'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { ArrowLeft, Loader2, BookOpen, MapPin, Clock } from 'lucide-react';

const REQUEST_TYPES = [
  { value: 'FIND_PARTNER', label: 'Tìm bạn học' },
  { value: 'FIND_TUTOR', label: 'Tìm gia sư' },
  { value: 'FIND_GROUP', label: 'Tìm nhóm' },
  { value: 'SHARE_MATERIAL', label: 'Chia sẻ tài liệu' },
];

export default function CreateStudyRequestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    title: '',
    subject: '',
    description: '',
    type: 'FIND_PARTNER',
    preferredTime: '',
    preferredLocation: '',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/study-groups/requests', {
        ...form,
        userId: user?.id,
      });
      return res.data.data;
    },
    onSuccess: () => {
      router.push('/study/requests');
    },
    onError: (err: any) => alert(err?.message || 'Tạo yêu cầu thất bại'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.subject) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="max-w-[700px] w-full pb-20 pt-6 px-4">
      <Link href="/study/requests" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-semibold text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách yêu cầu
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo yêu cầu học</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề *</label>
          <input type="text" required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="VD: Tìm bạn ôn thi Cấu trúc dữ liệu"
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
                placeholder="VD: CS001"
                className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại yêu cầu</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700">
              {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả chi tiết</label>
          <textarea rows={4} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả nhu cầu, mục tiêu, nội dung cần hỗ trợ..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thời gian mong muốn</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={form.preferredTime}
                onChange={e => setForm({ ...form, preferredTime: e.target.value })}
                placeholder="VD: Tối T2-T6"
                className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Địa điểm mong muốn</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={form.preferredLocation}
                onChange={e => setForm({ ...form, preferredLocation: e.target.value })}
                placeholder="VD: Thư viện Tầng 3"
                className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={createMutation.isPending}
          className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng yêu cầu'}
        </button>
      </form>
    </div>
  );
}
