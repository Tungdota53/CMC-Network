'use client';

import { Avatar } from '@/components/ui/Avatar';
import { StoryUserGroup } from '@/hooks/useStories';

interface StoryCardProps {
  userGroup: StoryUserGroup;
  onClick: () => void;
}

export function StoryCard({ userGroup, onClick }: StoryCardProps) {
  // Determine thumbnail (cover photo) from the first unviewed story, or the first story
  const firstUnviewed = userGroup.stories.find((s) => !s.isViewed) || userGroup.stories[0];
  
  // Decide cover style
  let coverContent;
  if (firstUnviewed?.type === 'TEXT') {
    coverContent = (
      <div
        className="w-full h-full flex items-center justify-center p-2"
        style={{
          background: firstUnviewed.bgGradient || firstUnviewed.bgColor || '#1877F2',
        }}
      >
        <p
          className="text-white text-[10px] text-center font-semibold overflow-hidden line-clamp-4"
          style={{ fontFamily: firstUnviewed.fontStyle || 'inherit' }}
        >
          {firstUnviewed.textContent}
        </p>
      </div>
    );
  } else if (firstUnviewed?.thumbnailUrl || firstUnviewed?.mediaUrl) {
    coverContent = (
      <img
        src={firstUnviewed.thumbnailUrl || firstUnviewed.mediaUrl}
        alt=""
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    );
  } else {
    coverContent = <div className="w-full h-full bg-gray-300" />;
  }

  // Border ring based on viewed status (Linear gradient for unviewed, gray for viewed)
  const ringStyle = userGroup.hasUnviewed
    ? 'ring-[3px] ring-offset-2 ring-primary border-transparent'
    : 'ring-[3px] ring-offset-2 ring-border border-transparent opacity-80';

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[110px] h-[195px] rounded-xl overflow-hidden relative cursor-pointer group shadow-sm"
    >
      {/* Cover Image/Text */}
      <div className="absolute inset-0 bg-black/20">
        {coverContent}
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      </div>

      {/* Avatar Badge */}
      <div className="absolute top-3 left-3">
        <div className={`rounded-full ${ringStyle}`}>
          <Avatar src={userGroup.avatarUrl || undefined} fallback={userGroup.fullName.charAt(0)} size="sm" />
        </div>
      </div>

      {/* Name Label */}
      <div className="absolute bottom-3 left-2 right-2 text-white font-semibold text-xs truncate drop-shadow-md">
        {userGroup.fullName}
      </div>
    </div>
  );
}
