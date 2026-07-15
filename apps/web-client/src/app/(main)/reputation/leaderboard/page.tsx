'use client';

import React, { useState } from 'react';
import { Trophy, Medal, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', timeframe],
    queryFn: async () => {
      try {
        const res = await api.get('/reputation/leaderboard', { params: { timeframe } });
        return res.data?.data?.items || res.data?.items || res.data || [];
      } catch (e) {
        return [];
      }
    }
  });

  const list = Array.isArray(leaderboard) ? leaderboard : [];
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="max-w-[900px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/reputation" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary font-semibold text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại
      </Link>
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-foreground mb-2 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" /> Bảng xếp hạng
        </h1>
        <p className="text-foreground/60">Tôn vinh những sinh viên tích cực đóng góp nhất CMC Campus</p>
      </div>

      <div className="flex justify-center mb-12">
        <div className="bg-card border border-border p-1 rounded-xl flex gap-1 shadow-sm">
          <button onClick={() => setTimeframe('week')} className={`px-6 py-2 font-bold rounded-lg text-sm transition-colors ${timeframe === 'week' ? 'bg-foreground text-background shadow-sm' : 'text-foreground/60 hover:bg-hover'}`}>Tuần này</button>
          <button onClick={() => setTimeframe('month')} className={`px-6 py-2 font-bold rounded-lg text-sm transition-colors ${timeframe === 'month' ? 'bg-foreground text-background shadow-sm' : 'text-foreground/60 hover:bg-hover'}`}>Tháng này</button>
          <button onClick={() => setTimeframe('all')} className={`px-6 py-2 font-bold rounded-lg text-sm transition-colors ${timeframe === 'all' ? 'bg-foreground text-background shadow-sm' : 'text-foreground/60 hover:bg-hover'}`}>Tất cả</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
          <p className="text-foreground/60">Chưa có dữ liệu bảng xếp hạng.</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <div className="flex justify-center items-end gap-2 sm:gap-6 mb-12 h-64">
              {/* Rank 2 */}
              <div className="flex flex-col items-center flex-1 max-w-[150px]">
                <div className="w-16 h-16 rounded-full bg-card border-4 border-border shadow-md mb-2 flex items-center justify-center font-black text-2xl text-foreground/50">2</div>
                <p className="font-bold text-foreground text-sm text-center line-clamp-1">{top3[1]?.name}</p>
                <p className="text-amber-500 font-black text-xs mb-3">{top3[1]?.xp} XP</p>
                <div className="w-full h-32 bg-gradient-to-t from-hover to-card rounded-t-2xl border-t-4 border-border flex justify-center pt-2">
                  <span className="font-black text-3xl text-foreground/20">2</span>
                </div>
              </div>

              {/* Rank 1 */}
              <div className="flex flex-col items-center flex-1 max-w-[150px] z-10">
                <div className="absolute -mt-8"><Medal className="w-8 h-8 text-amber-500 drop-shadow-md" /></div>
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border-4 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] mb-2 flex items-center justify-center font-black text-3xl text-amber-500">1</div>
                <p className="font-black text-foreground text-base text-center line-clamp-1">{top3[0]?.name}</p>
                <p className="text-amber-500 font-black text-sm mb-3">{top3[0]?.xp} XP</p>
                <div className="w-full h-40 bg-gradient-to-t from-amber-500/20 to-amber-500/5 rounded-t-2xl border-t-4 border-amber-500 flex justify-center pt-3">
                  <span className="font-black text-4xl text-amber-500/30">1</span>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center flex-1 max-w-[150px]">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 border-4 border-orange-500/50 shadow-md mb-2 flex items-center justify-center font-black text-2xl text-orange-500">3</div>
                <p className="font-bold text-foreground text-sm text-center line-clamp-1">{top3[2]?.name}</p>
                <p className="text-amber-500 font-black text-xs mb-3">{top3[2]?.xp} XP</p>
                <div className="w-full h-24 bg-gradient-to-t from-orange-500/20 to-orange-500/5 rounded-t-2xl border-t-4 border-orange-500/50 flex justify-center pt-2">
                  <span className="font-black text-3xl text-orange-500/30">3</span>
                </div>
              </div>
            </div>
          )}

          {/* List */}
          {rest.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {rest.map((user: any, i: number) => (
                <div key={user.rank} className={`flex items-center gap-4 p-4 ${i !== rest.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="w-8 font-black text-foreground/40 text-center">{user.rank}</div>
                  <div className="w-10 h-10 rounded-full bg-hover flex items-center justify-center font-bold text-foreground/70">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground">{user.name}</h4>
                    <p className="text-xs text-foreground/50">{user.faculty} • {user.badges} huy hiệu</p>
                  </div>
                  <div className="font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                    {user.xp} XP
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
