'use client';

import React, { useRef, useState } from 'react';
import { Download, Languages, Loader2, Upload, X } from 'lucide-react';
import api from '@/lib/api';

type PdfTranslationStudioProps = {
  initialFileUrl?: string;
  initialFileName?: string;
  compact?: boolean;
};

type ApiRequestError = {
  detail?: string;
  message?: string;
  statusCode?: number;
};

const getRequestErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const apiError = error as ApiRequestError;
    return apiError.detail || apiError.message || (apiError.statusCode ? `Lỗi HTTP ${apiError.statusCode}` : 'Không thể dịch PDF');
  }
  return 'Không thể dịch PDF';
};

const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const value = String(reader.result || '');
    resolve(value.split(',')[1] || '');
  };
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export function PdfTranslationStudio({ initialFileUrl, initialFileName, compact = false }: PdfTranslationStudioProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  const sourceName = file?.name || initialFileName || 'Tài liệu PDF hiện tại';
  const canTranslate = Boolean(file || initialFileUrl);

  const translate = async () => {
    if (!canTranslate) return;
    setError('');
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');
    setIsWorking(true);
    setProgress(12);
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + 7, 88)), 700);
    try {
      const payload: Record<string, string | number> = { targetLang: 'vi', maxPages: 15 };
      if (file) {
        payload.fileBase64 = await fileToBase64(file);
        payload.fileName = file.name;
      } else if (initialFileUrl) {
        payload.fileUrl = initialFileUrl;
        payload.fileName = initialFileName || 'material.pdf';
      }
      const response = await api.post('/ai/translate-pdf', payload, { timeout: 180000, responseType: 'blob' });
      setDownloadUrl(URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })));
      setProgress(100);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError));
    } finally {
      window.clearInterval(timer);
      setIsWorking(false);
    }
  };

  const downloadTranslation = () => {
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${sourceName.replace(/\.pdf$/i, '')}-tieng-viet.pdf`;
    link.click();
  };

  return (
    <section className={`overflow-hidden rounded-2xl border border-blue-200 bg-card shadow-sm ${compact ? '' : 'mb-8'}`} aria-labelledby="pdf-translation-title">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-5 text-white sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/15 p-2.5"><Languages className="h-6 w-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">AI PDF Translator</p><h2 id="pdf-translation-title" className="mt-1 text-xl font-bold">Dịch PDF sang Tiếng Việt</h2><p className="mt-1 text-sm text-blue-100">Giữ bố cục trang, bảo toàn công thức, URL và thuật ngữ chuyên ngành.</p></div>
          </div>
          {downloadUrl && <button onClick={downloadTranslation} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700"><Download className="h-4 w-4" /> Tải PDF đã dịch</button>}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {!downloadUrl && (
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-24 items-center gap-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-4 text-left transition hover:border-blue-400 dark:bg-blue-950/20">
              <div className="rounded-xl bg-white p-3 text-blue-600 shadow-sm dark:bg-slate-900"><Upload className="h-5 w-5" /></div>
              <div className="min-w-0"><p className="truncate font-bold text-foreground">{sourceName}</p><p className="mt-1 text-sm text-foreground/60">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · PDF đã chọn` : initialFileUrl ? 'Dùng PDF đang xem' : 'Chọn PDF tối đa 10 MB'}</p></div>
              {file && <X onClick={(event) => { event.stopPropagation(); setFile(null); }} className="ml-auto h-5 w-5 shrink-0 text-foreground/40" />}
            </button>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => { const selected = event.target.files?.[0]; if (!selected) return; if (selected.size > 10 * 1024 * 1024) { setError('PDF vượt quá giới hạn 10 MB.'); return; } setFile(selected); setError(''); }} />
            <button onClick={translate} disabled={!canTranslate || isWorking} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {isWorking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Languages className="h-5 w-5" />}{isWorking ? 'Đang dịch...' : 'Bắt đầu dịch'}
            </button>
          </div>
        )}

        {isWorking && <div className="mt-5"><div className="mb-2 flex justify-between text-xs font-semibold text-foreground/60"><span>Đang đọc bố cục và dịch từng khối văn bản</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>}
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        {downloadUrl && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center"><p className="font-bold text-emerald-800">PDF tiếng Việt đã sẵn sàng</p><p className="mt-1 text-sm text-emerald-700">Bố cục trang và hình ảnh gốc được giữ lại.</p><button onClick={downloadTranslation} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white"><Download className="h-4 w-4" /> Tải file PDF</button><button onClick={() => { URL.revokeObjectURL(downloadUrl); setDownloadUrl(''); setProgress(0); }} className="ml-4 text-sm font-bold text-primary hover:underline">Dịch tài liệu khác</button></div>}
      </div>
    </section>
  );
}
