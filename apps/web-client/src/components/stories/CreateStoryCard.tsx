'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { StoryCreator } from './StoryCreator';

export function CreateStoryCard() {
  const { user } = useAuthStore();
  const [creatorOpen, setCreatorOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setCreatorOpen(true)}
        className="flex-shrink-0 w-[110px] h-[195px] bg-card rounded-xl shadow-sm border border-border overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity group"
      >
      {/* Background (User's avatar or default gradient) */}
      <div className="w-full h-3/4 relative">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
      </div>

      {/* Plus Button overlapping the split */}
      <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-10 h-10 bg-primary rounded-full border-4 border-card flex items-center justify-center">
        <Plus className="w-6 h-6 text-white" />
      </div>

      {/* Footer Text */}
      <div className="w-full h-1/4 bg-card flex items-end justify-center pb-2">
        <span className="font-semibold text-xs text-foreground">Tạo tin</span>
      </div>
      </div>
      
      <StoryCreator isOpen={creatorOpen} onClose={() => setCreatorOpen(false)} />
    </>
  );
}
