'use client';
import React, { useState } from 'react';
import { Play, TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

function gradeToGpa4(g: number) {
  if (g >= 8.5) return 4.0;
  if (g >= 8.0) return 3.5;
  if (g >= 7.0) return 3.0;
  if (g >= 6.5) return 2.5;
  if (g >= 5.5) return 2.0;
  if (g >= 5.0) return 1.5;
  if (g >= 4.0) return 1.0;
  return 0.0;
}

export const GpaSimulator = () => {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['grades', 'summary'],
    queryFn: async () => {
      try {
        const res = await api.get('/grades/summary');
        return res.data?.data || res.data || { gpa4: 0, totalCredits: 0 };
      } catch {
        return { gpa4: 0, totalCredits: 0 };
      }
    }
  });

  const CURRENT_GPA = summaryData?.gpa4 || 0;
  const CURRENT_CREDITS = summaryData?.totalCredits || 0;

  const [simEntries, setSimEntries] = useState([
    { credits: 3, grade: 7.5 },
  ]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const simGpa4Entries = simEntries.map(e => gradeToGpa4(e.grade) * e.credits);
  const simTotalCredits = simEntries.reduce((s, e) => s + e.credits, 0);
  const simSumGpa4 = simGpa4Entries.reduce((s, v) => s + v, 0);

  const allCredits = CURRENT_CREDITS + simTotalCredits;
  const simulatedGpa = allCredits > 0
    ? (CURRENT_GPA * CURRENT_CREDITS + simSumGpa4) / allCredits
    : CURRENT_GPA;
  const diff = simulatedGpa - CURRENT_GPA;

  const addEntry = () => setSimEntries(p => [...p, { credits: 3, grade: 7.0 }]);
  const removeEntry = (i: number) => setSimEntries(p => p.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: 'credits' | 'grade', val: number) =>
    setSimEntries(p => p.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Play className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">GPA Simulator</h3>
          <p className="text-xs text-foreground/50">Mô phỏng GPA nếu bạn đạt điểm sau ở các môn tới</p>
        </div>
      </div>

      {/* Result banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-4">
        <div className="text-center">
          <p className="text-xs text-foreground/50 font-semibold">GPA hiện tại</p>
          <p className="text-2xl font-black text-foreground">{CURRENT_GPA.toFixed(2)}</p>
        </div>
        <div className="flex-1 text-center">
          <TrendingUp className={`w-6 h-6 mx-auto mb-1 ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          <p className={`text-sm font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-foreground/50 font-semibold">GPA dự kiến</p>
          <p className={`text-2xl font-black ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{simulatedGpa.toFixed(2)}</p>
        </div>
      </div>

      {/* Hypothetical entries */}
      <div className="space-y-4 mb-4">
        {simEntries.map((e, i) => (
          <div key={i} className="p-4 bg-background rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-foreground/80 text-sm">Môn học {i + 1}</span>
              <button onClick={() => removeEntry(i)} className="text-foreground/30 hover:text-red-400 text-xs font-bold transition-colors">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-foreground/60 font-semibold">Tín chỉ: {e.credits}</label>
                <input type="range" min={1} max={6} value={e.credits}
                  onChange={ev => updateEntry(i, 'credits', +ev.target.value)}
                  className="w-full accent-primary mt-1" />
              </div>
              <div>
                <label className="text-xs text-foreground/60 font-semibold">
                  Điểm: {e.grade.toFixed(1)} (Hệ 4: {gradeToGpa4(e.grade).toFixed(1)})
                </label>
                <input type="range" min={0} max={10} step={0.1} value={e.grade}
                  onChange={ev => updateEntry(i, 'grade', +ev.target.value)}
                  className="w-full accent-primary mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addEntry}
        className="w-full py-2.5 border-2 border-dashed border-border text-primary font-bold rounded-xl hover:bg-hover hover:border-primary/50 transition-colors text-sm">
        + Thêm môn học giả định
      </button>
    </div>
  );
};
