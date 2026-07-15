'use client';

import React from 'react';
import { GpaSummaryCard } from '@/components/grades/GpaSummaryCard';
import { GradeTable } from '@/components/grades/GradeTable';
import { GpaSimulator } from '@/components/grades/GpaSimulator';
import { FacultyComparison } from '@/components/grades/FacultyComparison';
import { GradeImportExport } from '@/components/grades/GradeImportExport';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function GpaTrackerPage() {
  const { data: gpaData, isLoading } = useQuery({
    queryKey: ['grades', 'summary'],
    queryFn: async () => {
      try {
        const res = await api.get('/grades/summary');
        return res.data?.data || res.data || { gpa4: 0, gpa10: 0, totalCredits: 0, trend: [] };
      } catch {
        return { gpa4: 0, gpa10: 0, totalCredits: 0, trend: [] };
      }
    }
  });

  const trend = gpaData?.trend || [];
  const maxGpa = Math.max(...trend.map((s: any) => s.gpa4), 4.0);

  return (
    <div className="max-w-[1100px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-foreground mb-1 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Theo dõi GPA
          </h1>
          <p className="text-foreground/60">Quản lý điểm số, mô phỏng kịch bản và so sánh với khoa</p>
        </div>
        <GradeImportExport />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* GPA Card */}
          <div className="mb-8">
            <GpaSummaryCard
              gpa4={gpaData?.gpa4 || 0}
              gpa10={gpaData?.gpa10 || 0}
              totalCredits={gpaData?.totalCredits || 0}
              prevGpa4={trend[trend.length - 2]?.gpa4}
            />
          </div>

          {/* Semester trend mini-chart */}
          {trend.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-8">
              <h3 className="font-bold text-foreground mb-5">GPA theo từng học kỳ</h3>
              <div className="flex items-end gap-4 h-32">
                {trend.map((s: any) => (
                  <div key={s.sem} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-primary">{s.gpa4.toFixed(2)}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/50 transition-all duration-700 hover:from-primary/90 cursor-pointer"
                      style={{ height: `${(s.gpa4 / maxGpa) * 100}%` }}
                    />
                    <span className="text-xs text-foreground/50 font-medium text-center leading-tight">{s.sem}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main content 2-col */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-foreground">Bảng điểm chi tiết</h2>
              <GradeTable />
            </div>

            <div className="space-y-6">
              <GpaSimulator />
              <FacultyComparison />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
