'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Download, Upload, FileText, AlertTriangle, CheckCircle2, XCircle, FileDown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractList } from '@/lib/adapters';

// ── CSV parsing (RFC 4180 compliant) ───────────────────────

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  cells.push(current.trim());
  return cells;
}

interface ParsedRow {
  subject: string;
  subjectCode: string;
  semester: string;
  credits: number;
  grade10: number;
  errors: string[];
  isValid: boolean;
}

function validateRow(raw: { subject?: string; subjectCode?: string; semester?: string; credits?: string; grade10?: string }): ParsedRow {
  const errors: string[] = [];
  const subject = (raw.subject || '').trim();
  const subjectCode = (raw.subjectCode || '').trim();
  const semester = (raw.semester || '').trim();
  const creditsStr = (raw.credits || '').trim();
  const gradeStr = (raw.grade10 || '').trim();

  if (!subject) errors.push('Thiếu tên môn');
  if (!semester) errors.push('Thiếu học kỳ');

  const credits = Number(creditsStr);
  if (!creditsStr || isNaN(credits)) errors.push('Tín chỉ không hợp lệ');
  else if (credits < 1 || credits > 6) errors.push(`Tín chỉ 1-6 (hiện ${credits})`);

  const grade10 = Number(gradeStr);
  if (!gradeStr || isNaN(grade10)) errors.push('Điểm không hợp lệ');
  else if (grade10 < 0 || grade10 > 10) errors.push(`Điểm 0-10 (hiện ${grade10})`);

  return { subject, subjectCode, semester, credits: credits || 0, grade10: grade10 || 0, errors, isValid: errors.length === 0 };
}

function parseRows(text: string): ParsedRow[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const cells = parseCsvLine(line);
    return validateRow({ subject: cells[0], subjectCode: cells[1], semester: cells[2], credits: cells[3], grade10: cells[4] });
  });
}

function gradeToLetter(g: number): string {
  if (g >= 8.5) return 'A';
  if (g >= 8.0) return 'B+';
  if (g >= 7.0) return 'B';
  if (g >= 6.5) return 'C+';
  if (g >= 5.5) return 'C';
  if (g >= 4.0) return 'D';
  return 'F';
}

function gradeToGpa4(g: number): number {
  const letter = gradeToLetter(g);
  if (letter === 'A') return 4.0;
  if (letter === 'B+') return 3.5;
  if (letter === 'B') return 3.0;
  if (letter === 'C+') return 2.5;
  if (letter === 'C') return 2.0;
  if (letter === 'D') return 1.0;
  return 0.0;
}

const csvEscape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

// ── Academic warning rules ──────────────────────────────────

function getWarningLevel(gpa4: number): { label: string; color: string; description: string } | null {
  if (gpa4 < 1.0) return { label: 'Buộc thôi học', color: 'text-red-600', description: 'GPA hệ 4 dưới 1.0 — sinh viên bị xem xét buộc thôi học.' };
  if (gpa4 < 1.5) return { label: 'Cảnh báo học vụ', color: 'text-orange-500', description: 'GPA hệ 4 dưới 1.5 — sinh viên bị cảnh báo học vụ.' };
  if (gpa4 < 2.0) return { label: 'Kém', color: 'text-yellow-500', description: 'GPA hệ 4 dưới 2.0 — cần cải thiện kết quả học tập.' };
  return null;
}

// ── Component ───────────────────────────────────────────────

export const GradeImportExport = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [showWarnings, setShowWarnings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ['grades', 'list'],
    queryFn: async () => {
      const res = await api.get('/grades');
      return extractList(res);
    },
  });

  const rows = parseRows(text);
  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);
  const grades = Array.isArray(data) ? data : [];

  const totalCredits = grades.reduce((sum: number, g: any) => sum + (g.credits || 0), 0);
  const totalPoints = grades.reduce((sum: number, g: any) => sum + (g.credits || 0) * gradeToGpa4(g.grade10 ?? g.grade ?? 0), 0);
  const gpa4 = totalCredits > 0 ? totalPoints / totalCredits : 0;
  const warning = getWarningLevel(gpa4);

  const importMutation = useMutation({
    mutationFn: async () => {
      const items = validRows.map((r) => ({
        subject: r.subject,
        subjectCode: r.subjectCode || undefined,
        semester: r.semester,
        credits: r.credits,
        grade10: r.grade10,
      }));
      await api.post('/grades/import', { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['grades', 'summary'] });
      setOpen(false);
      setText('');
    },
  });

  const exportCsv = () => {
    const header = ['subject', 'subjectCode', 'semester', 'credits', 'grade10', 'letter'];
    const body = grades.map((grade: any) =>
      [grade.subject ?? grade.subjectName, grade.subjectCode, grade.semester, grade.credits, grade.grade10 ?? grade.grade, grade.letter ?? gradeToLetter(grade.grade10 ?? grade.grade ?? 0)]
        .map(csvEscape).join(','),
    );
    const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bang-diem-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const semesters = grades.reduce<Record<string, any[]>>((acc, g: any) => {
      const sem = g.semester || 'Không rõ';
      (acc[sem] = acc[sem] || []).push(g);
      return acc;
    }, {});

    const semHtml = Object.entries(semesters).sort(([a], [b]) => b.localeCompare(a)).map(([sem, entries]) => {
      const rowsHtml = entries.map((g: any) => {
        const grade10 = g.grade10 ?? g.grade ?? 0;
        const letter = g.letter ?? gradeToLetter(grade10);
        return `<tr>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;">${g.subject ?? g.subjectName ?? ''}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:center;">${g.subjectCode || '-'}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:center;">${g.credits || 0}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:center;font-weight:bold;">${grade10.toFixed(1)}</td>
          <td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:center;font-weight:bold;">${letter}</td>
        </tr>`;
      }).join('');
      const semCredits = entries.reduce((s: number, g: any) => s + (g.credits || 0), 0);
      const semPoints = entries.reduce((s: number, g: any) => s + (g.credits || 0) * gradeToGpa4(g.grade10 ?? g.grade ?? 0), 0);
      const semGpa = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : '0.00';
      return `<h3 style="margin:16px 0 8px;color:#1e293b;">${sem} — GPA: ${semGpa} (${semCredits} tín chỉ)</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:6px 12px;border:1px solid #e2e8f0;text-align:left;">Tên môn</th>
            <th style="padding:6px 12px;border:1px solid #e2e8f0;">Mã môn</th>
            <th style="padding:6px 12px;border:1px solid #e2e8f0;">Tín chỉ</th>
            <th style="padding:6px 12px;border:1px solid #e2e8f0;">Điểm 10</th>
            <th style="padding:6px 12px;border:1px solid #e2e8f0;">Chữ cái</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>`;
    }).join('');

    const warningHtml = warning
      ? `<div style="margin:16px 0;padding:12px 16px;border-radius:8px;background:${warning.color.includes('red') ? '#fef2f2' : warning.color.includes('orange') ? '#fff7ed' : '#fefce8'};border-left:4px solid ${warning.color.includes('red') ? '#dc2626' : warning.color.includes('orange') ? '#f97316' : '#eab308'};">
          <strong style="color:${warning.color.includes('red') ? '#dc2626' : warning.color.includes('orange') ? '#f97316' : '#eab308'};">⚠ ${warning.label}</strong>
          <p style="margin:4px 0 0;font-size:13px;color:#475569;">${warning.description}</p>
        </div>`
      : '';

    printWindow.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Bảng điểm — ${new Date().toLocaleDateString('vi-VN')}</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; padding: 32px; color: #0f172a; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; }
    .summary div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; }
    .summary .label { font-size: 12px; color: #64748b; }
    .summary .value { font-size: 22px; font-weight: 800; color: #2563eb; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Bảng điểm CMC Network</h1>
  <p class="meta">Xuất ngày ${new Date().toLocaleDateString('vi-VN')} — Tổng ${grades.length} môn, ${totalCredits} tín chỉ</p>
  <div class="summary">
    <div><div class="label">GPA hệ 4</div><div class="value">${gpa4.toFixed(2)}</div></div>
    <div><div class="label">Tổng tín chỉ</div><div class="value">${totalCredits}</div></div>
    <div><div class="label">Số môn</div><div class="value">${grades.length}</div></div>
  </div>
  ${warningHtml}
  ${semHtml}
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const lines = content.split('\n');
      const firstLine = lines[0]?.toLowerCase() || '';
      const hasHeader = firstLine.includes('subject') || firstLine.includes('tên môn') || firstLine.includes('mã môn');
      setText(hasHeader ? lines.slice(1).join('\n') : content);
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => setOpen(true)} className="px-4 py-2.5 bg-card border border-border rounded-xl font-bold text-foreground flex items-center gap-2 hover:bg-hover transition-colors shadow-sm text-sm">
        <Upload className="w-4 h-4" /> Import điểm
      </button>
      <button onClick={exportCsv} className="px-4 py-2.5 bg-card border border-border rounded-xl font-bold text-foreground flex items-center gap-2 hover:bg-hover transition-colors shadow-sm text-sm">
        <Download className="w-4 h-4" /> Xuất CSV
      </button>
      <button onClick={exportPdf} className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors text-sm shadow-sm">
        <FileDown className="w-4 h-4" /> Xuất PDF
      </button>
      {warning && (
        <button onClick={() => setShowWarnings(!showWarnings)} className="px-4 py-2.5 bg-card border border-border rounded-xl font-bold flex items-center gap-2 hover:bg-hover transition-colors shadow-sm text-sm">
          <AlertTriangle className={`w-4 h-4 ${warning.color}`} /> {warning.label}
        </button>
      )}
      {showWarnings && warning && (
        <div className="w-full mt-2 p-4 rounded-xl bg-card border border-border">
          <div className={`flex items-center gap-2 font-bold ${warning.color}`}>
            <AlertTriangle className="w-5 h-5" /> {warning.label}
          </div>
          <p className="text-sm text-foreground/60 mt-1">{warning.description}</p>
          <p className="text-xs text-foreground/50 mt-2">GPA hệ 4 hiện tại: <strong>{gpa4.toFixed(2)}</strong> / 4.00</p>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-foreground mb-2">Import bảng điểm</h3>
            <p className="text-sm text-foreground/60 mb-4">
              Dán CSV hoặc tải file. Mỗi dòng: <code className="px-1.5 py-0.5 bg-hover rounded text-xs">tên môn,mã môn,học kỳ,tín chỉ,điểm hệ 10</code>
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mb-3 px-4 py-2 bg-hover border border-border rounded-xl font-semibold text-sm text-foreground flex items-center gap-2 hover:bg-hover/80 transition-colors"
            >
              <FileText className="w-4 h-4" /> Chọn file .csv
            </button>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground font-mono"
              placeholder="Toán rời rạc,CS101,HK1 2025-2026,3,8.5"
            />

            {rows.length > 0 && (
              <div className="flex gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> {validRows.length} hợp lệ
                </span>
                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1.5 text-red-500">
                    <XCircle className="w-4 h-4" /> {invalidRows.length} lỗi
                  </span>
                )}
                <span className="text-foreground/50">Tổng {rows.length} dòng</span>
              </div>
            )}

            {rows.length > 0 && (
              <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-hover">
                    <tr className="text-left text-foreground/60 font-semibold">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Tên môn</th>
                      <th className="px-3 py-2">Mã môn</th>
                      <th className="px-3 py-2">Học kỳ</th>
                      <th className="px-3 py-2 text-center">Tín chỉ</th>
                      <th className="px-3 py-2 text-center">Điểm</th>
                      <th className="px-3 py-2 text-center">Chữ</th>
                      <th className="px-3 py-2">Lỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-t border-border/50 ${row.isValid ? '' : 'bg-red-50 dark:bg-red-950/20'}`}
                      >
                        <td className="px-3 py-2 text-foreground/40">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{row.subject || <span className="text-red-400">—</span>}</td>
                        <td className="px-3 py-2 text-foreground/60 font-mono">{row.subjectCode || '-'}</td>
                        <td className="px-3 py-2 text-foreground/60">{row.semester || <span className="text-red-400">—</span>}</td>
                        <td className="px-3 py-2 text-center">{row.credits || '-'}</td>
                        <td className="px-3 py-2 text-center font-bold">{row.grade10 ? row.grade10.toFixed(1) : '-'}</td>
                        <td className="px-3 py-2 text-center font-bold">{row.isValid ? gradeToLetter(row.grade10) : '-'}</td>
                        <td className="px-3 py-2 text-red-500 text-xs">{row.errors.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setOpen(false); setText(''); }} className="px-4 py-2 rounded-xl bg-hover font-bold text-sm text-foreground">Hủy</button>
              <button
                onClick={() => importMutation.mutate()}
                disabled={!validRows.length || importMutation.isPending}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
              >
                {importMutation.isPending ? 'Đang import...' : `Import ${validRows.length} môn`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
