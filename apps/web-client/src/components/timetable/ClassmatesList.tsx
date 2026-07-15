'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';
import api from '@/lib/api';

export const ClassmatesList = ({ classCode }: { classCode?: string | null }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['timetable', 'classmates', classCode],
    enabled: Boolean(classCode),
    queryFn: async () => {
      const res = await api.get('/timetable/classmates', { params: { classCode } });
      return res.data?.data || res.data || [];
    },
  });

  const classmates = Array.isArray(data) ? data : [];

  return (
    <div className="mt-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
      <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-foreground/50" /> Bạn cùng lớp
      </h4>
      {!classCode ? (
        <div className="text-center py-6 bg-hover rounded-xl border border-dashed border-border/50">
          <span className="text-foreground/40 text-sm font-medium">Chưa chọn môn học</span>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : classmates.length === 0 ? (
        <p className="text-sm text-foreground/50">Chưa tìm thấy bạn học chung lớp {classCode}.</p>
      ) : (
        <div className="space-y-3">
          {classmates.map((user: any) => (
            <div key={user.id} className="flex items-center gap-3 rounded-xl bg-hover p-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">{(user.fullName || 'U').charAt(0)}</div>
              <div>
                <p className="text-sm font-bold text-foreground">{user.fullName || 'Sinh viên'}</p>
                <p className="text-xs text-foreground/50">{user.major || 'Chưa cập nhật'}{user.cohort ? ` · K${user.cohort}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
