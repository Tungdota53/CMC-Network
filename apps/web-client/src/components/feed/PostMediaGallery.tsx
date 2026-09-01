'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Post } from '@/hooks/useFeed';

type MediaItem = Post['media'][number];

interface PostMediaGalleryProps {
  media: MediaItem[];
  compact?: boolean;
}

function galleryClass(count: number, compact: boolean) {
  const height = compact ? 'h-[300px] sm:h-[360px]' : 'h-[360px] sm:h-[500px]';
  if (count === 1) return 'grid-cols-1 bg-transparent';
  if (count === 2) return `grid-cols-2 ${height}`;
  if (count <= 4) return `grid-cols-2 grid-rows-2 ${height}`;
  return `grid-cols-6 grid-rows-2 ${height}`;
}

function itemClass(count: number, index: number) {
  if (count === 3 && index === 0) return 'row-span-2';
  if (count >= 5) return index < 2 ? 'col-span-3' : 'col-span-2';
  return '';
}

export function PostMediaGallery({ media, compact = false }: PostMediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const visibleMedia = media.slice(0, media.length >= 5 ? 5 : 4);
  const activeMedia = activeIndex === null ? null : media[activeIndex];

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => current === null ? null : (current - 1 + media.length) % media.length);
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => current === null ? null : (current + 1) % media.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, media.length]);

  const showPrevious = () => {
    setActiveIndex((current) => current === null ? null : (current - 1 + media.length) % media.length);
  };

  const showNext = () => {
    setActiveIndex((current) => current === null ? null : (current + 1) % media.length);
  };

  return (
    <>
      <div className={`grid w-full gap-0.5 overflow-hidden bg-border/50 ${galleryClass(media.length, compact)}`}>
        {visibleMedia.map((item, index) => (
          <div key={item.id} className={`relative min-h-0 min-w-0 overflow-hidden ${media.length === 1 ? 'bg-transparent' : 'bg-black/5'} ${itemClass(media.length, index)}`}>
            {item.mediaType === 'VIDEO' ? (
              <video
                src={item.mediaUrl}
                className={media.length === 1 ? 'max-h-[600px] w-full bg-black object-contain' : 'h-full w-full object-cover'}
                controls
                preload="metadata"
              />
            ) : (
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`block w-full cursor-zoom-in overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white ${media.length === 1 ? '' : 'h-full'}`}
                aria-label={`Xem ảnh ${index + 1} trong ${media.length} ảnh`}
              >
                <img
                  src={item.mediaUrl}
                  alt={`Ảnh ${index + 1} của bài viết`}
                  className={media.length === 1
                    ? `w-full h-auto object-cover ${compact ? 'max-h-[480px]' : 'max-h-[680px]'}`
                    : 'h-full w-full object-cover'}
                  loading="lazy"
                />
              </button>
            )}
            {index === 4 && media.length > 5 && (
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-3xl font-bold text-white transition-colors hover:bg-black/60"
                aria-label={`Xem thêm ${media.length - 5} ảnh`}
              >
                +{media.length - 5}
              </button>
            )}
          </div>
        ))}
      </div>

      {activeMedia && activeMedia.mediaType !== 'VIDEO' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-2 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Trình xem ảnh bài viết"
          onClick={() => setActiveIndex(null)}
        >
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-3 pb-10 pt-3 text-white sm:px-5 sm:pt-5">
            <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-medium">
              {(activeIndex ?? 0) + 1} / {media.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 transition-colors hover:bg-white/20"
              aria-label="Đóng trình xem ảnh"
              autoFocus
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {media.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); showPrevious(); }}
                className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-white/20 sm:left-5 sm:h-14 sm:w-14"
                aria-label="Xem ảnh trước"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); showNext(); }}
                className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-white/20 sm:right-5 sm:h-14 sm:w-14"
                aria-label="Xem ảnh tiếp theo"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <img
            src={activeMedia.mediaUrl}
            alt={`Ảnh ${(activeIndex ?? 0) + 1} của bài viết`}
            className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-1rem)] select-none object-contain sm:max-h-[calc(100dvh-3rem)] sm:max-w-[calc(100vw-8rem)]"
            onClick={(event) => event.stopPropagation()}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
