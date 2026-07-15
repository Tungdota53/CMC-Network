'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, GraduationCap, Loader2, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { errorMessage } from '@/lib/adapters';

export default function MentorRegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ bio: '', expertise: '', gpa: '', schedule: '' });

  const registerMentor = useMutation({
    mutationFn: async () => {
      const expertise = form.expertise
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      return api.post('/mentors/me', {
        bio: form.bio.trim(),
        expertise,
        gpa: form.gpa ? Number(form.gpa) : undefined,
        schedule: form.schedule.trim() ? { note: form.schedule.trim() } : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      router.push('/mentors');
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.bio.trim() || !form.expertise.trim()) return;
    registerMentor.mutate();
  };

  return (
    <div className="max-w-[720px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/mentors" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại Mentor Connect
      </Link>

      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold text-foreground mb-1 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" /> Đăng ký làm mentor
        </h1>
        <p className="text-foreground/60">Hoàn thiện hồ sơ để sinh viên khác có thể tìm và đặt lịch học với bạn.</p>
      </div>

      <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Giới thiệu bản thân *</label>
          <textarea
            value={form.bio}
            onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
            placeholder="Bạn giỏi môn gì, từng hỗ trợ ai, phong cách dạy thế nào..."
            rows={5}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Kỹ năng / môn học *</label>
          <input
            value={form.expertise}
            onChange={(event) => setForm((prev) => ({ ...prev, expertise: event.target.value }))}
            placeholder="VD: Java, React, Toán rời rạc, IELTS"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
            required
          />
          <p className="text-xs text-foreground/50 mt-2">Ngăn cách nhiều kỹ năng bằng dấu phẩy.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">GPA</label>
          <input
            value={form.gpa}
            onChange={(event) => setForm((prev) => ({ ...prev, gpa: event.target.value }))}
            placeholder="VD: 3.6"
            type="number"
            step="0.01"
            min="0"
            max="4"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Lịch rảnh / ghi chú đặt lịch</label>
          <textarea
            value={form.schedule}
            onChange={(event) => setForm((prev) => ({ ...prev, schedule: event.target.value }))}
            placeholder="VD: Tối thứ 2-4-6, online qua Google Meet; cuối tuần học trực tiếp tại campus."
            rows={3}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {registerMentor.isError && (
          <p className="text-sm font-medium text-red-500">{errorMessage(registerMentor.error)}</p>
        )}

        <button
          type="submit"
          disabled={registerMentor.isPending || !form.bio.trim() || !form.expertise.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {registerMentor.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {registerMentor.isPending ? 'Đang lưu...' : 'Lưu hồ sơ mentor'}
        </button>
      </form>
    </div>
  );
}
