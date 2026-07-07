"use client";

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';
import { SkeletonRow } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

type UserReputation = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  major?: string | null;
  cohort?: string | null;
  reputationScore: number;
  badges?: Array<string | { badge?: string }>;
};

export default function LeaderboardPage() {
  const { user } = useUser();
  const [leaders, setLeaders] = useState<UserReputation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await apiFetch('/reputation/leaderboard?limit=20');
        if (res.ok) {
          setLeaders(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="w-full flex flex-col mx-auto space-y-6 pb-20">
      <div className="glass rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-2">
              <span>🏆</span> Bảng Xếp Hạng
            </h1>
            <p className="text-gray-400 text-sm mt-2">Vinh danh những thành viên đóng góp tích cực nhất cộng đồng CampusConnect.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-3xl p-4 divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : leaders.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Chưa có dữ liệu bảng xếp hạng"
          description="Tích cực đóng góp, chia sẻ tài liệu và tương tác để leo lên bảng xếp hạng uy tín."
        />
      ) : (
        <div className="glass rounded-3xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Top 3 */}
            {[1, 0, 2].map(idx => {
              const leader = leaders[idx];
              if (!leader) return <div key={idx} className="hidden md:block" />;
              const isFirst = idx === 0;
              const colors = [
                'from-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.4)]', 
                'from-gray-300 to-gray-400', 
                'from-orange-400 to-red-400'
              ];
              const medals = ['🥇', '🥈', '🥉'];
              
              return (
                <div key={leader.id} className={`flex flex-col items-center bg-white/5 border border-white/10 p-6 rounded-3xl relative ${isFirst ? 'scale-105 z-10 border-yellow-500/30 bg-yellow-500/5' : 'mt-4'}`}>
                  <div className="absolute -top-4 text-3xl drop-shadow-lg">{medals[idx]}</div>
                  <div className={`w-24 h-24 rounded-full p-1 bg-gradient-to-br ${colors[idx]} mb-3`}>
                    <img src={leader.avatarUrl || `https://i.pravatar.cc/150?u=${leader.id}`} className="w-full h-full rounded-full object-cover border-2 border-[#0f172a]" alt="" />
                  </div>
                  <h3 className="font-bold text-lg text-white text-center truncate w-full">{leader.fullName}</h3>
                  <p className="text-[12px] text-gray-400 text-center truncate w-full">{leader.major || 'Thành viên'}</p>
                  <div className="mt-3 px-4 py-1.5 bg-white/10 rounded-full font-bold text-white flex items-center gap-1">
                    🌟 {leader.reputationScore}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {leaders.slice(3).map((leader, index) => {
              const rank = index + 4;
              const isMe = user?.id === leader.id;
              return (
                <div key={leader.id} className={`flex items-center justify-between p-4 rounded-2xl transition-colors border ${isMe ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 text-center font-bold ${isMe ? 'text-blue-400' : 'text-gray-400'}`}>#{rank}</span>
                    <img src={leader.avatarUrl || `https://i.pravatar.cc/150?u=${leader.id}`} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <div>
                      <p className={`font-bold text-[15px] ${isMe ? 'text-blue-400' : 'text-gray-200'}`}>{leader.fullName} {isMe && '(Bạn)'}</p>
                      <p className="text-[12px] text-gray-500">{leader.major || 'Thành viên'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {leader.badges && leader.badges.length > 0 && (
                      <div className="hidden sm:flex gap-1">
                        {leader.badges.slice(0, 3).map((b, i) => (
                          <span key={i} className="text-lg" title={typeof b === 'string' ? b : b.badge}>🏆</span>
                        ))}
                      </div>
                    )}
                    <span className="font-bold text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full text-[13px] border border-yellow-400/20">
                      {leader.reputationScore} đ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
