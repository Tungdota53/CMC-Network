'use client';

import { useState } from 'react';
import { Plus, Compass, Users } from 'lucide-react';
import { SuggestedGroups } from '@/components/groups/SuggestedGroups';
import { GroupActivityFeed } from '@/components/groups/GroupActivityFeed';
import { YourGroupsList } from '@/components/groups/YourGroupsList';
import { cn } from '@/lib/utils';

export default function GroupsPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'your_groups'>('discover');

  return (
    <div className="w-full max-w-[850px] pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[28px] font-bold text-foreground flex items-center gap-3"><Users className="w-8 h-8 text-primary" /> Nhóm</h1>
        <button className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 px-4 py-2 rounded-lg font-semibold transition-all">
          <Plus className="w-5 h-5" />
          Tạo nhóm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button 
          onClick={() => setActiveTab('discover')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 font-semibold text-[15px] border-b-[3px] transition-colors",
            activeTab === 'discover' ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:bg-hover rounded-t-lg"
          )}
        >
          <Compass className="w-5 h-5" />
          Khám phá
        </button>
        <button 
          onClick={() => setActiveTab('your_groups')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 font-semibold text-[15px] border-b-[3px] transition-colors",
            activeTab === 'your_groups' ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:bg-hover rounded-t-lg"
          )}
        >
          <Users className="w-5 h-5" />
          Nhóm của bạn
        </button>
      </div>

      {/* Content */}
      <div className="transition-all duration-300 relative">
        {activeTab === 'discover' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SuggestedGroups />
            <GroupActivityFeed title="Hoạt động nổi bật từ các nhóm" />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <YourGroupsList />
            <GroupActivityFeed title="Hoạt động gần đây trong nhóm của bạn" />
          </div>
        )}
      </div>
    </div>
  );
}
