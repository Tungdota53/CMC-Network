'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import api from '@/lib/api';

const parseRows = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
  const [title, classCode, dayOfWeek, startTime, endTime, room, lecturer] = line.split(',').map((cell) => cell.trim());
  return { title, classCode, dayOfWeek: Number(dayOfWeek), startTime, endTime, room, lecturer };
});

export const BulkImportDialog = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const rows = parseRows(text);
  const mutation = useMutation({
    mutationFn: async () => api.post('/timetable/import', { items: rows }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', 'events'] });
      setText('');
      setOpen(false);
    },
  });

  return (
    <div>
      <button onClick={() => setOpen((value) => !value)} className="px-4 py-2.5 bg-card border border-border text-foreground rounded-xl font-bold flex items-center gap-2 hover:bg-hover transition-colors shadow-sm text-sm">
        <Upload className="w-4 h-4" /> Import hàng loạt
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <h3 className="font-black text-foreground mb-2">Import lịch học</h3>
            <p className="text-sm text-foreground/60 mb-4">Mỗi dòng: tên,mã lớp,thứ(0-6),bắt đầu,kết thúc,phòng,giảng viên</p>
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground" placeholder="Toán rời rạc,CS101,0,07:00,09:00,A101,Thầy A" />
            <p className="text-xs text-foreground/50 mt-2">Preview: {rows.length} dòng hợp lệ sẽ gửi backend kiểm tra trùng lịch.</p>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl bg-hover font-bold text-sm text-foreground">Hủy</button>
              <button onClick={() => mutation.mutate()} disabled={!rows.length || mutation.isPending} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">{mutation.isPending ? 'Đang import...' : 'Import'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
