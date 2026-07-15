'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Plus, Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { errorMessage, extractData } from '@/lib/adapters';

const categories = ['Học thuật', 'Công nghệ', 'Nghệ thuật', 'Thể thao', 'Tình nguyện', 'Sở thích'];

export default function CreateClubPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Học thuật',
    joinMode: 'OPEN',
    rules: '',
  });

  const createClub = useMutation({
    mutationFn: async () => {
      const res = await api.post('/clubs', {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        joinMode: form.joinMode,
        rules: form.rules.trim(),
      });
      return extractData<any>(res);
    },
    onSuccess: (club) => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      router.push(club?.id ? `/clubs/${club.id}` : '/clubs');
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    createClub.mutate();
  };

  return (
    <div className="max-w-[860px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/clubs" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại CLB
      </Link>

      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold text-foreground mb-1 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" /> Tạo cộng đồng
        </h1>
        <p className="text-foreground/60">Tạo cộng đồng học tập, CLB sở thích hoặc nhóm sinh viên.</p>
      </div>

      <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-6 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Tên cộng đồng *</label>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="VD: CMC AI Club, CLB Sách, Cộng đồng Ký túc xá"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
                maxLength={120}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Nêu mục tiêu, hoạt động chính, đối tượng tham gia..."
                rows={5}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary resize-none"
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Quy định nhanh</label>
              <textarea
                value={form.rules}
                onChange={(event) => setForm((prev) => ({ ...prev, rules: event.target.value }))}
                placeholder="VD: Tôn trọng thành viên, không spam, chia sẻ đúng chủ đề..."
                rows={4}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary resize-none"
                maxLength={1000}
              />
            </div>
          </div>

          <aside className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Danh mục</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category }))}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${form.category === category ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground/70 hover:bg-hover'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Cách tham gia</label>
              <div className="space-y-2">
                {[
                  { value: 'OPEN', label: 'Mở', desc: 'Ai cũng có thể tham gia ngay.' },
                  { value: 'APPROVAL', label: 'Cần duyệt', desc: 'Quản trị viên duyệt yêu cầu.' },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, joinMode: mode.value }))}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${form.joinMode === mode.value ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-hover'}`}
                  >
                    <span className="block text-sm font-bold text-foreground">{mode.label}</span>
                    <span className="block text-xs text-foreground/55 mt-0.5">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-foreground/60">
              Các trường danh mục, quy định và cách tham gia sẽ được lưu đầy đủ sau Phase schema Club v1. Hiện tại form đã sẵn sàng payload để backend nhận.
            </div>
          </aside>
        </div>

        {createClub.isError && (
          <p className="text-sm font-medium text-red-500">{errorMessage(createClub.error)}</p>
        )}

        <button
          type="submit"
          disabled={createClub.isPending || !form.name.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {createClub.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {createClub.isPending ? 'Đang tạo...' : 'Tạo cộng đồng'}
        </button>
      </form>
    </div>
  );
}
