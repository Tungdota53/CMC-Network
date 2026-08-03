'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateLiveStream } from '@/hooks/useLiveStreams';

export function LiveStreamLauncher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const createStream = useCreateLiveStream();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const stream = await createStream.mutateAsync({ title: title.trim(), description: description.trim() || undefined });
      onClose();
      router.push(`/live/${stream.id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể bắt đầu livestream');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="live-title">
      <form onSubmit={submit} className="w-full max-w-lg rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-500"><Radio className="h-5 w-5" /></div>
            <div><h2 id="live-title" className="text-lg font-bold">Bắt đầu phát trực tiếp</h2><p className="text-sm text-muted-foreground">Camera và micro chỉ bật sau khi vào phòng.</p></div>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-hover" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>
        <label className="mt-6 block text-sm font-semibold">Tiêu đề</label>
        <input autoFocus required minLength={3} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bạn muốn chia sẻ điều gì?" className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        <label className="mt-4 block text-sm font-semibold">Mô tả <span className="font-normal text-muted-foreground">(không bắt buộc)</span></label>
        <textarea maxLength={500} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Giới thiệu ngắn về buổi phát" className="mt-2 w-full resize-none rounded-2xl border border-border bg-background p-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        <div className="mt-5 rounded-2xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">Người xem chỉ có quyền xem và nghe. Bạn có thể kết thúc phiên bất kỳ lúc nào.</div>
        <button disabled={createStream.isPending || title.trim().length < 3} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"><Video className="h-5 w-5" />{createStream.isPending ? 'Đang tạo phòng…' : 'Phát trực tiếp'}</button>
      </form>
    </div>
  );
}