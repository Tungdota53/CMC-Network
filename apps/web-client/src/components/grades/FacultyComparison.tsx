'use client';
import React from 'react';
import { BarChart2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const FacultyComparison = () => {
  const { data: facultyData, isLoading } = useQuery({
    queryKey: ['grades', 'faculty-comparison'],
    queryFn: async () => {
      try {
        const res = await api.get('/grades/faculty-comparison');
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    }
  });

  const data = Array.isArray(facultyData) && facultyData.length > 0 ? facultyData : [
    { label: 'Không có dữ liệu', gpa: 0, color: 'bg-border' }
  ];

  const max = Math.max(...data.map(d => d.gpa), 4.0);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <BarChart2 className="w-4 h-4 text-blue-500" />
        </div>
        <h3 className="font-bold text-foreground">So sánh với khoa</h3>
      </div>

      <div className="space-y-4">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between text-sm font-semibold text-foreground/80 mb-1.5">
              <span>{d.label}</span>
              <span>{d.gpa.toFixed(2)}</span>
            </div>
            <div className="h-4 bg-background rounded-full overflow-hidden border border-border">
              <div
                className={`h-full ${d.color || 'bg-primary'} rounded-full transition-all duration-700 opacity-90`}
                style={{ width: `${(d.gpa / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-foreground/40 mt-4 text-center font-medium">
        * Số liệu dựa trên người dùng CMC Campus — ẩn danh
      </p>
    </div>
  );
};
