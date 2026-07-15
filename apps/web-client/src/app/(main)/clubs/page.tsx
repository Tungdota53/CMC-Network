'use client';

import React, { useMemo } from 'react';
import { ClubCard } from '@/components/clubs/ClubCard';
import { Users, Compass, Plus, Loader2, Sparkles, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { useClubs } from '@/hooks/useClubs';

export default function ClubsPage() {
  const { data: clubs = [], isLoading } = useClubs();

  const myClubs = useMemo(() => clubs.filter((club) => club.isJoined), [clubs]);
  const official = useMemo(() => clubs.filter((club) => club.type === 'OFFICIAL_CLUB'), [clubs]);
  const community = useMemo(() => clubs.filter((club) => club.type === 'COMMUNITY'), [clubs]);
  const suggested = useMemo(() => clubs.filter((club) => !club.isJoined).slice(0, 6), [clubs]);

  return (
    <div className="max-w-[1100px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Trung tâm cộng đồng sinh viên
          </div>
          <h1 className="text-[28px] font-extrabold text-foreground mb-1 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> CLB & Cộng đồng
          </h1>
          <p className="text-foreground/60">Tham gia các câu lạc bộ và cộng đồng trong trường</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/clubs/discover" className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground font-bold rounded-xl hover:bg-hover shadow-sm text-sm transition-colors">
            <Compass className="w-4 h-4" /> Khám phá
          </Link>
          <Link href="/clubs/create" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-sm text-sm transition-colors">
            <Plus className="w-4 h-4" /> Tạo cộng đồng
          </Link>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground/45">Tổng CLB</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{clubs.length.toLocaleString('vi-VN')}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground/45">Đã tham gia</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{myClubs.length.toLocaleString('vi-VN')}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground/45">Cộng đồng mở</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{community.length.toLocaleString('vi-VN')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : clubs.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-foreground/60">Chưa có câu lạc bộ hoặc cộng đồng nào.</p>
        </div>
      ) : (
        <>
          {myClubs.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> CLB của tôi
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {myClubs.map((c) => <ClubCard key={c.id} {...c} />)}
              </div>
            </section>
          )}

          {suggested.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Gợi ý cho bạn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {suggested.map((c) => <ClubCard key={c.id} {...c} />)}
              </div>
            </section>
          )}

          {/* Official Clubs */}
          {official.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                CLB Chính thức
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {official.map((c) => <ClubCard key={c.id} {...c} />)}
              </div>
            </section>
          )}

          {/* Communities */}
          {community.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Cộng đồng tự do</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {community.map((c) => <ClubCard key={c.id} {...c} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
