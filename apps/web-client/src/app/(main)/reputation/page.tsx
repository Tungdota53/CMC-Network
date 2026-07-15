'use client';

import React from 'react';
import { Trophy, Star, TrendingUp, Medal, Shield } from 'lucide-react';
import { BadgeCard } from '@/components/reputation/BadgeCard';

import Link from 'next/link';
import { useReputation } from '@/hooks/useReputation';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

export default function ReputationPage() {
  const { data: reputationData, isLoading, isError, error, refetch } = useReputation();

  const xp = reputationData?.xp || 0;
  const badges = reputationData?.badges || [];
  const history = reputationData?.history || [];
  const nextLevelXp = reputationData?.nextLevelXp || 100;
  const levelProgress = Math.min(100, (xp / nextLevelXp) * 100);

  return (
    <div className="max-w-[1100px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-foreground mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500 fill-amber-500" />
            Uy tín & Danh hiệu
          </h1>
          <p className="text-foreground/60">Hoàn thành nhiệm vụ, kiếm XP và mở khóa huy hiệu</p>
        </div>
        
        <div className="flex bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-1">
          <button className="px-5 py-2 bg-foreground text-background font-bold rounded-xl text-sm transition-colors">Của tôi</button>
          <Link href="/reputation/leaderboard" className="px-5 py-2 text-foreground/70 font-bold hover:bg-hover rounded-xl text-sm transition-colors">
            Bảng xếp hạng
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main XP Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-border/50">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star className="w-48 h-48" />
            </div>
            
            <div className="relative z-10">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Tổng điểm uy tín</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                  {isLoading ? '...' : xp.toLocaleString()}
                </span>
                <span className="text-xl font-bold text-gray-500">XP</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 border border-white/10 backdrop-blur-sm">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-bold text-white">Level {reputationData?.level ?? 1}</span>
                </div>
                {xp > 500 && (
                  <div className="flex items-center gap-2 bg-blue-500/20 rounded-full px-4 py-2 border border-blue-500/30 backdrop-blur-sm">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-blue-300">Tài khoản chuẩn</span>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                  <span>{xp} XP</span>
                  <span>{nextLevelXp} XP</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full" style={{ width: `${levelProgress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Medal className="w-6 h-6 text-primary" /> Huy hiệu của tôi
              </h2>
              <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                Đã mở: {badges.filter((b: any) => b.isUnlocked).length}/{badges.length || 0}
              </span>
            </div>
            
            {isLoading ? (
              <LoadingState message="Đang tải huy hiệu..." />
            ) : isError ? (
              <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
            ) : badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((b: any) => (
                  <BadgeCard key={b.id} {...b} />
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có huy hiệu" description="Hoàn thành hoạt động để mở khóa huy hiệu." />
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">

          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold text-foreground mb-4">Lịch sử nhận điểm</h3>
            {isLoading ? (
              <LoadingState message="Đang tải lịch sử..." />
            ) : history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center pb-3 border-b border-border/50 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{item.action}</p>
                      <p className="text-xs text-foreground/50">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <span className="font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg text-xs">+{item.points} XP</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-foreground/50 text-sm">Chưa có giao dịch XP nào.</p>
              </div>
            )}
            {history.length > 0 && (
              <button className="w-full mt-4 py-2 text-sm font-bold text-primary hover:bg-hover rounded-xl transition-colors">
                Xem tất cả
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
