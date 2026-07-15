'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStoriesFeed, StoryUserGroup } from '@/hooks/useStories';
import { CreateStoryCard } from './CreateStoryCard';
import { StoryCard } from './StoryCard';
import { StoryViewer } from './StoryViewer';

export function StoryCarousel() {
  const { data, isLoading } = useStoriesFeed();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialUserIdx, setInitialUserIdx] = useState(0);

  // Empty fallback when backend returns no stories
  const users: StoryUserGroup[] = data?.users ?? [];

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollBy = (offset: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group bg-card rounded-xl shadow-sm border border-border p-4">
      {/* Scroll Left Button */}
      {showLeftArrow && (
        <button
          onClick={() => scrollBy(-300)}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-card rounded-full shadow-md border border-border flex items-center justify-center hover:bg-hover transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-6 h-6 text-foreground/80" />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="snap-start">
          <CreateStoryCard />
        </div>
        
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[110px] h-[195px] bg-hover rounded-xl animate-pulse snap-start skeleton" />
          ))
        ) : (
          users.map((userGroup, index) => (
            <div key={userGroup.userId} className="snap-start">
               <StoryCard
                userGroup={userGroup}
                onClick={() => {
                  setInitialUserIdx(index);
                  setViewerOpen(true);
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* Scroll Right Button */}
      {showRightArrow && users.length > 3 && (
        <button
          onClick={() => scrollBy(300)}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-card rounded-full shadow-md border border-border flex items-center justify-center hover:bg-hover transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-6 h-6 text-foreground/80" />
        </button>
      )}

      {/* Fullscreen Viewer Overlay */}
      {viewerOpen && (
        <StoryViewer
          users={users}
          initialUserIndex={initialUserIdx}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
