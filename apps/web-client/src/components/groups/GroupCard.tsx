'use client';

import { Users } from 'lucide-react';

interface GroupCardProps {
  group: {
    id: string;
    name?: string;
    title?: string;
    members?: number;
    currentMembers?: number;
    coverUrl?: string;
    type?: string;
    isJoined?: boolean;
  }
}

export function GroupCard({ group }: GroupCardProps) {
  const groupName = group.name || group.title || 'Nhóm không tên';
  const memberCount = group.members || group.currentMembers || 1;
  const coverImage = group.coverUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80';
  const groupType = group.type || 'Nhóm học tập';

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 flex flex-col h-full group">
      <div className="h-[120px] bg-muted relative w-full overflow-hidden">
        <img 
          src={coverImage} 
          alt={groupName} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute bottom-2 left-3">
          <span className="text-[11px] font-semibold bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full border border-white/30">
            {groupType}
          </span>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-[15px] text-foreground line-clamp-2 leading-tight mb-1">{groupName}</h3>
        <p className="text-xs text-foreground/60 flex items-center gap-1.5 mb-4">
          <Users className="w-3.5 h-3.5" />
          {memberCount.toLocaleString()} thành viên
        </p>
        <div className="mt-auto">
          <button className="w-full py-2 bg-primary/10 hover:bg-primary/20 active:bg-primary/30 text-primary font-semibold text-sm rounded-lg transition-colors">
            Tham gia nhóm
          </button>
        </div>
      </div>
    </div>
  );
}
