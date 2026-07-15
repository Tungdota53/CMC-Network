import React from 'react';
import { Avatar } from '@/components/ui/Avatar';

export const SeenAvatars = ({ seenBy }: { seenBy: any[] }) => {
  if (!seenBy || seenBy.length === 0) return null;

  return (
    <div className="flex justify-end gap-0.5 mt-0.5">
      {seenBy.slice(0, 3).map((user, idx) => (
        <Avatar key={idx} size="sm" className="w-3.5 h-3.5" />
      ))}
      {seenBy.length > 3 && (
        <div className="w-3.5 h-3.5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 font-medium">
          +{seenBy.length - 3}
        </div>
      )}
    </div>
  );
};
