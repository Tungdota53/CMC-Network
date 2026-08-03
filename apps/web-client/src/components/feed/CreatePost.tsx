'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { Video, Image as ImageIcon, Smile } from 'lucide-react';
import { CreatePostModal } from './CreatePostModal';
import { LiveStreamLauncher } from '@/components/live/LiveStreamLauncher';

export function CreatePost() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  useEffect(() => {
    const openComposer = () => setIsModalOpen(true);
    window.addEventListener('cmc:create-post', openComposer);
    return () => window.removeEventListener('cmc:create-post', openComposer);
  }, []);

  return (
    <>
      <div className="relative isolate rounded-2xl shadow-sm transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        {/* Bulletproof Glass Background Layer */}
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--card) 60%, transparent)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        />
        <div className="relative z-10 overflow-hidden rounded-2xl p-3">
          <div className="flex items-center gap-2 max-sm:flex-wrap">
          <Avatar src={user?.avatarUrl} fallback={user?.fullName?.charAt(0) || '?'} />
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-11 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-left font-medium text-foreground/60 transition-colors hover:bg-hover max-sm:min-w-0"
            aria-label="Tạo bài viết mới"
          >
            {user?.fullName?.split(' ').pop()} ơi, bạn đang nghĩ gì thế?
          </button>
          
          <div className="flex shrink-0 items-center gap-1 max-sm:ml-12 max-sm:w-[calc(100%-3rem)] max-sm:justify-between">
            <button
              onClick={() => setIsLiveOpen(true)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-red-500 transition-colors hover:bg-hover"
              title="Phát trực tiếp"
              aria-label="Tạo bài viết phát trực tiếp"
            >
              <Video className="w-[22px] h-[22px]" fill="currentColor" stroke="none" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-green-500 transition-colors hover:bg-hover"
              title="Ảnh/Video"
              aria-label="Tạo bài viết ảnh hoặc video"
            >
              <ImageIcon className="w-[22px] h-[22px]" fill="currentColor" stroke="none" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-yellow-500 transition-colors hover:bg-hover"
              title="Cảm xúc/Hoạt động"
              aria-label="Tạo bài viết cảm xúc hoặc hoạt động"
            >
              <Smile className="w-[22px] h-[22px]" fill="currentColor" stroke="none" />
            </button>
          </div>
          </div>
        </div>
      </div>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <LiveStreamLauncher open={isLiveOpen} onClose={() => setIsLiveOpen(false)} />
    </>
  );
}
