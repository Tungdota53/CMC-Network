'use client';

import { useState } from 'react';
import { 
  Users, UserPlus, UserCheck, UserX, UserMinus, Search, Ban, ChevronRight, Settings
} from 'lucide-react';
import { FriendCard, FriendCardType } from '@/components/friends/FriendCard';
import { 
  useFriends, useIncomingRequests, useOutgoingRequests, 
  useFriendSuggestions, useBlockedUsers, FriendUser 
} from '@/hooks/useFriends';
import Link from 'next/link';

type Tab = 'HOME' | 'INCOMING' | 'SUGGESTIONS' | 'ALL' | 'OUTGOING' | 'BLOCKED';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('HOME');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data hooks
  const { data: friendsData, isLoading: loadingAll } = useFriends(50);
  const { data: incomingReqs, isLoading: loadingInc } = useIncomingRequests();
  const { data: suggestions, isLoading: loadingSug } = useFriendSuggestions();
  const { data: outgoingReqs, isLoading: loadingOut } = useOutgoingRequests();
  const { data: blockedUsers, isLoading: loadingBlk } = useBlockedUsers();

  const getTitle = () => {
    switch (activeTab) {
      case 'HOME': return 'Trang chủ Bạn bè';
      case 'INCOMING': return 'Lời mời kết bạn';
      case 'SUGGESTIONS': return 'Gợi ý kết bạn';
      case 'ALL': return 'Tất cả bạn bè';
      case 'OUTGOING': return 'Lời mời đã gửi';
      case 'BLOCKED': return 'Danh sách chặn';
    }
  };

  const renderGrid = (list: FriendUser[], type: FriendCardType, emptyMsg: string, isLoading: boolean) => {
    let displayList = list;
    if (searchQuery) {
      displayList = list.filter((u) => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-xl aspect-[3/4] animate-pulse skeleton border border-border" />
          ))}
        </div>
      );
    }

    if (displayList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-foreground/50">
          <div className="w-24 h-24 bg-hover rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-foreground/30" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Chưa có dữ liệu</h3>
          <p className="text-foreground/60">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {displayList.map((user) => (
          <FriendCard key={user.id} user={user} type={type} />
        ))}
      </div>
    );
  };

  const renderHomeContent = () => {
    return (
      <div className="space-y-12">
        {/* Incoming Requests Section */}
        {(!loadingInc && incomingReqs && incomingReqs.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                Lời mời kết bạn 
                <span className="text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-full text-[15px] font-bold shadow-sm">{incomingReqs.length}</span>
              </h2>
              <button onClick={() => setActiveTab('INCOMING')} className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg font-medium transition-colors">
                Xem tất cả
              </button>
            </div>
            {renderGrid(incomingReqs.slice(0, 5), 'INCOMING', '', false)}
            <div className="border-b border-border/50 pb-8"></div>
          </section>
        )}

        {/* Suggestions Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Những người bạn có thể biết</h2>
            <button onClick={() => setActiveTab('SUGGESTIONS')} className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Xem tất cả
            </button>
          </div>
          {renderGrid(suggestions?.slice(0, 10) || [], 'SUGGESTION', 'Không có gợi ý nào.', loadingSug)}
        </section>
      </div>
    );
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-3.5rem)] bg-background">
      {/* LEFT SIDEBAR - MODERN STYLE */}
      <aside className="w-[360px] shrink-0 bg-card/40 backdrop-blur-xl border-r border-border/30 sticky top-14 h-[calc(100vh-3.5rem)] flex flex-col z-10 shadow-sm hidden md:flex">
        <div className="p-5 flex items-center justify-between">
          <h1 className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-purple-500 tracking-tight">Bạn bè</h1>
          <button className="w-10 h-10 rounded-full bg-background border border-border/40 shadow-sm flex items-center justify-center hover:scale-105 hover:bg-hover transition-all">
            <Settings className="w-5 h-5 text-foreground/80" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm bạn bè..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-background/50 backdrop-blur-sm border border-border/40 rounded-2xl pl-10 pr-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-foreground shadow-inner transition-all hover:bg-background/80"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('HOME')}
            className={`relative w-full flex items-center justify-between p-3 rounded-2xl font-semibold transition-all duration-200 group overflow-hidden mb-1 ${activeTab === 'HOME' ? 'bg-primary/10 border border-primary/20 shadow-sm text-primary' : 'hover:bg-hover/80 border border-transparent text-foreground'}`}
          >
            {activeTab === 'HOME' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === 'HOME' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-background border border-border/50 text-foreground/70 group-hover:text-foreground'}`}>
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[15px]">Trang chủ</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('INCOMING')}
            className={`relative w-full flex items-center justify-between p-3 rounded-2xl font-semibold transition-all duration-200 group overflow-hidden mb-1 ${activeTab === 'INCOMING' ? 'bg-primary/10 border border-primary/20 shadow-sm text-primary' : 'hover:bg-hover/80 border border-transparent text-foreground'}`}
          >
            {activeTab === 'INCOMING' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === 'INCOMING' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-background border border-border/50 text-foreground/70 group-hover:text-foreground'}`}>
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[15px]">Lời mời kết bạn</span>
            </div>
            {incomingReqs && incomingReqs.length > 0 && (
              <span className="bg-red-500 text-white text-[13px] px-2.5 py-0.5 rounded-full shadow-sm">{incomingReqs.length}</span>
            )}
            {activeTab !== 'INCOMING' && <ChevronRight className="w-5 h-5 text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>

          <button 
            onClick={() => setActiveTab('SUGGESTIONS')}
            className={`relative w-full flex items-center justify-between p-3 rounded-2xl font-semibold transition-all duration-200 group overflow-hidden mb-1 ${activeTab === 'SUGGESTIONS' ? 'bg-primary/10 border border-primary/20 shadow-sm text-primary' : 'hover:bg-hover/80 border border-transparent text-foreground'}`}
          >
            {activeTab === 'SUGGESTIONS' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === 'SUGGESTIONS' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-background border border-border/50 text-foreground/70 group-hover:text-foreground'}`}>
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[15px]">Gợi ý</span>
            </div>
            {activeTab !== 'SUGGESTIONS' && <ChevronRight className="w-5 h-5 text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>

          <button 
            onClick={() => setActiveTab('ALL')}
            className={`relative w-full flex items-center justify-between p-3 rounded-2xl font-semibold transition-all duration-200 group overflow-hidden mb-1 ${activeTab === 'ALL' ? 'bg-primary/10 border border-primary/20 shadow-sm text-primary' : 'hover:bg-hover/80 border border-transparent text-foreground'}`}
          >
            {activeTab === 'ALL' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === 'ALL' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-background border border-border/50 text-foreground/70 group-hover:text-foreground'}`}>
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[15px]">Tất cả bạn bè</span>
            </div>
            {activeTab !== 'ALL' && <ChevronRight className="w-5 h-5 text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>

          <button 
            onClick={() => setActiveTab('OUTGOING')}
            className={`relative w-full flex items-center justify-between p-3 rounded-2xl font-semibold transition-all duration-200 group overflow-hidden mb-1 ${activeTab === 'OUTGOING' ? 'bg-primary/10 border border-primary/20 shadow-sm text-primary' : 'hover:bg-hover/80 border border-transparent text-foreground'}`}
          >
            {activeTab === 'OUTGOING' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === 'OUTGOING' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-background border border-border/50 text-foreground/70 group-hover:text-foreground'}`}>
                <UserMinus className="w-5 h-5" />
              </div>
              <span className="text-[15px]">Lời mời đã gửi</span>
            </div>
            {activeTab !== 'OUTGOING' && <ChevronRight className="w-5 h-5 text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>

          <button 
            onClick={() => setActiveTab('BLOCKED')}
            className={`relative w-full flex items-center justify-between p-3 rounded-2xl font-semibold transition-all duration-200 group overflow-hidden mb-1 ${activeTab === 'BLOCKED' ? 'bg-red-500/10 border border-red-500/20 shadow-sm text-red-500' : 'hover:bg-hover/80 border border-transparent text-foreground'}`}
          >
            {activeTab === 'BLOCKED' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r-full" />}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === 'BLOCKED' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-background border border-border/50 text-foreground/70 group-hover:text-foreground'}`}>
                <Ban className="w-5 h-5" />
              </div>
              <span className="text-[15px]">Danh sách chặn</span>
            </div>
            {activeTab !== 'BLOCKED' && <ChevronRight className="w-5 h-5 text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)]">
        <div className="max-w-[1200px] p-6 md:p-10">
          {activeTab === 'HOME' ? (
            renderHomeContent()
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="mb-8 border-b border-border/30 pb-6">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">{getTitle()}</h2>
              </div>
              
              {activeTab === 'INCOMING' && renderGrid(incomingReqs || [], 'INCOMING', 'Không có lời mời kết bạn nào.', loadingInc)}
              {activeTab === 'SUGGESTIONS' && renderGrid(suggestions || [], 'SUGGESTION', 'Không có gợi ý kết bạn lúc này.', loadingSug)}
              {activeTab === 'ALL' && renderGrid(friendsData?.friends || [], 'FRIEND', 'Bạn chưa có người bạn nào.', loadingAll)}
              {activeTab === 'OUTGOING' && renderGrid(outgoingReqs || [], 'OUTGOING', 'Bạn chưa gửi lời mời kết bạn nào.', loadingOut)}
              {activeTab === 'BLOCKED' && renderGrid(blockedUsers || [], 'BLOCKED', 'Danh sách chặn trống.', loadingBlk)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
