'use client';
import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, Loader2, Pencil, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const SEMESTERS = ['HK1 2025-2026', 'HK2 2025-2026', 'HK1 2026-2027'];

function gradeToLetter(g: number) {
  if (g >= 8.5) return { letter: 'A', cls: 'bg-emerald-500/10 text-emerald-500', gpa4: 4.0 };
  if (g >= 8.0) return { letter: 'B+', cls: 'bg-emerald-500/10 text-emerald-400', gpa4: 3.5 };
  if (g >= 7.0) return { letter: 'B', cls: 'bg-blue-500/10 text-blue-500', gpa4: 3.0 };
  if (g >= 6.5) return { letter: 'C+', cls: 'bg-yellow-500/10 text-yellow-500', gpa4: 2.5 };
  if (g >= 5.5) return { letter: 'C', cls: 'bg-orange-500/10 text-orange-500', gpa4: 2.0 };
  if (g >= 4.0) return { letter: 'D', cls: 'bg-red-500/10 text-red-400', gpa4: 1.0 };
  return { letter: 'F', cls: 'bg-red-500/20 text-red-500', gpa4: 0.0 };
}

type GradeForm = { subject: string; subjectCode: string; credits: number; grade10: number; semester: string };

const emptyForm: GradeForm = { subject: '', subjectCode: '', credits: 3, grade10: 7.0, semester: SEMESTERS[0] };

export const GradeTable = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GradeForm>(emptyForm);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['grades', 'list'],
    queryFn: async () => {
      const res = await api.get('/grades');
      return res.data?.data?.items || res.data?.items || res.data?.data || res.data || [];
    },
  });

  const gradeList = Array.isArray(entries) ? entries : [];

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveMutation = useMutation({
    mutationFn: async (entry: GradeForm) => {
      const payload = { ...entry, subject: entry.subject.trim(), subjectCode: entry.subjectCode.trim() || undefined };
      if (editingId) await api.put(`/grades/${editingId}`, payload);
      else await api.post('/grades', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['grades', 'summary'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/grades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['grades', 'summary'] });
    },
  });

  const handleSave = () => {
    if (!form.subject.trim()) return;
    saveMutation.mutate(form);
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setShowForm(true);
    setForm({
      subject: entry.subject ?? entry.subjectName ?? '',
      subjectCode: entry.subjectCode ?? '',
      credits: entry.credits ?? 3,
      grade10: entry.grade10 ?? entry.grade ?? 0,
      semester: entry.semester ?? SEMESTERS[0],
    });
  };

  const grouped = gradeList.reduce<Record<string, any[]>>((acc, entry) => {
    acc[entry.semester] = [...(acc[entry.semester] ?? []), entry];
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 bg-card rounded-2xl border border-border">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {gradeList.length === 0 && !showForm && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-foreground/60">
          <BookOpen className="w-8 h-8 mx-auto mb-3 text-primary/70" />
          <p className="font-bold text-foreground">Chưa có điểm</p>
          <p className="text-sm">Thêm môn học đầu tiên để bắt đầu tính GPA.</p>
        </div>
      )}

      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([sem, semEntries]) => (
        <div key={sem} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-hover/50 border-b border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              {sem}
            </h3>
            <span className="text-xs text-foreground/50 font-medium">{semEntries.length} môn học</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/50 font-semibold text-xs border-b border-border">
                <th className="px-5 py-3">Tên môn học</th>
                <th className="px-4 py-3 text-center">Mã môn</th>
                <th className="px-4 py-3 text-center">Tín chỉ</th>
                <th className="px-4 py-3 text-center">Điểm 10</th>
                <th className="px-4 py-3 text-center">Chữ cái</th>
                <th className="px-4 py-3 text-center">Hệ 4</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {semEntries.map((entry: any) => {
                const grade10 = entry.grade10 ?? entry.grade ?? 0;
                const subject = entry.subject ?? entry.subjectName ?? 'Không tên';
                const { letter, cls, gpa4 } = gradeToLetter(grade10);
                return (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-hover transition-colors group">
                    <td className="px-5 py-3 font-semibold text-foreground">{subject}</td>
                    <td className="px-4 py-3 text-center text-foreground/60 font-mono text-xs">{entry.subjectCode || '-'}</td>
                    <td className="px-4 py-3 text-center font-bold text-foreground/80">{entry.credits}</td>
                    <td className="px-4 py-3 text-center"><span className="font-black text-foreground">{grade10.toFixed(1)}</span></td>
                    <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-lg text-xs font-black ${cls}`}>{letter}</span></td>
                    <td className="px-4 py-3 text-center font-bold text-foreground/80">{gpa4.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEdit(entry)} className="text-foreground/40 hover:text-primary transition-colors" aria-label="Sửa điểm"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteMutation.mutate(entry.id)} className="text-foreground/30 hover:text-red-500 transition-colors" aria-label="Xóa điểm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {showForm && (
        <div className="bg-card rounded-2xl border border-primary/20 shadow-sm p-5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-foreground">{editingId ? 'Sửa môn học' : 'Thêm môn học mới'}</h4>
            <button onClick={resetForm} className="text-foreground/40 hover:text-foreground" aria-label="Đóng form"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Tên môn học *" className="col-span-2 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground" />
            <input value={form.subjectCode} onChange={(event) => setForm((current) => ({ ...current, subjectCode: event.target.value }))} placeholder="Mã môn (tùy chọn)" className="px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground" />
            <div>
              <label className="text-xs text-foreground/60 font-semibold mb-1 block">Tín chỉ: {form.credits}</label>
              <input type="range" min={1} max={6} value={form.credits} onChange={(event) => setForm((current) => ({ ...current, credits: +event.target.value }))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="text-xs text-foreground/60 font-semibold mb-1 block">Điểm: {form.grade10.toFixed(1)}</label>
              <input type="range" min={0} max={10} step={0.1} value={form.grade10} onChange={(event) => setForm((current) => ({ ...current, grade10: +event.target.value }))} className="w-full accent-primary" />
            </div>
            <select value={form.semester} onChange={(event) => setForm((current) => ({ ...current, semester: event.target.value }))} className="px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground">
              {SEMESTERS.map((semester) => <option key={semester}>{semester}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saveMutation.isPending} className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50">
              {saveMutation.isPending ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Lưu môn học'}
            </button>
            <button onClick={resetForm} className="px-5 py-2 bg-hover text-foreground font-bold rounded-xl hover:bg-foreground/10 transition-colors text-sm">Hủy</button>
          </div>
        </div>
      )}

      <button onClick={() => { setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-border text-foreground/50 font-bold rounded-2xl hover:border-primary/50 hover:text-primary transition-colors w-full justify-center">
        <Plus className="w-5 h-5" /> Thêm môn học
      </button>
    </div>
  );
};
