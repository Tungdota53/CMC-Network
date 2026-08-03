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
  if (firstUnviewed?.sharedPost) {
    const sharedPost = firstUnviewed.sharedPost;
    coverContent = (
      <div
        className="flex h-full w-full items-center justify-center p-2"
        style={{ background: firstUnviewed.bgGradient || '#1877F2' }}
      >
        <div className="mt-3 w-full overflow-hidden rounded-lg bg-white text-slate-900 shadow-lg transition-transform duration-300 group-hover:scale-[1.03]">
          <div className="flex items-center gap-1.5 p-2">
            <Avatar src={sharedPost.authorAvatarUrl} fallback={sharedPost.authorName.charAt(0) || '?'} size="sm" />
            <p className="min-w-0 flex-1 truncate text-[8px] font-bold leading-tight">{sharedPost.authorName}</p>
          </div>
          {sharedPost.content && (
            <p className="line-clamp-3 px-2 pb-2 text-[7px] leading-[1.35]">{sharedPost.content}</p>
          )}
          {sharedPost.mediaUrl && (
            <img src={sharedPost.mediaUrl} alt="" className="h-[82px] w-full object-cover" />
          )}
          <div className="border-t border-slate-200 py-1 text-center text-[7px] font-semibold text-blue-600">Xem bài viết</div>
        </div>
      </div>
    );
  } else if (firstUnviewed?.type === 'TEXT') {
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
