'use client';

import { use } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { LiveStreamRoom } from '@/components/live/LiveStreamRoom';
import { useLiveStream } from '@/hooks/useLiveStreams';

export default function LiveStreamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = useLiveStream(id);

  if (isLoading) return <div className="flex min-h-[70vh] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-red-500" /></div>;
  if (error || !data) return <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center"><AlertCircle className="mb-3 h-9 w-9 text-red-500" /><h1 className="text-xl font-bold">Không tải được livestream</h1><p className="mt-2 text-sm text-muted-foreground">Phiên có thể đã bị xóa hoặc kết nối mạng bị gián đoạn.</p><button onClick={() => refetch()} className="mt-5 min-h-11 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground">Thử lại</button></div>;
  return <LiveStreamRoom stream={data} />;
}
