'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Loader2, Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface ClubCardProps {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  type: 'OFFICIAL_CLUB' | 'COMMUNITY';
  isVerified: boolean;
  memberCount: number;
  isJoined?: boolean;
  updatedAt?: string | null;
}

const withImageVersion = (url?: string | null, version?: string | null) => {
  if (!url) return '';
  if (!url.startsWith('/uploads/')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version || '')}`;
};

export const ClubCard = ({ id, name, description, logoUrl, bannerUrl, type, isVerified, memberCount, isJoined, updatedAt }: ClubCardProps) => {
  const queryClient = useQueryClient();
  const versionedLogoUrl = withImageVersion(logoUrl, updatedAt);
  const versionedBannerUrl = withImageVersion(bannerUrl, updatedAt);
  const joinMutation = useMutation({
    mutationFn: async () => (isJoined ? api.delete(`/clubs/${id}/join`) : api.post(`/clubs/${id}/join`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', id] });
    },
  });

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/30 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-primary/30 transition-all duration-300 group overflow-hidden flex flex-col relative h-full">
      {/* Dynamic Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Banner */}
      <div className="h-[90px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        {versionedBannerUrl && <Image src={versionedBannerUrl} alt={name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />}
      </div>

      {/* Content Area */}
      <div className="px-4 pt-0 pb-5 flex flex-col flex-1 relative z-10">
        {/* Avatar */}
        <div className="-mt-7 mb-2.5">
          <div className="w-14 h-14 rounded-2xl border-4 border-background shadow-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl font-black text-indigo-600 overflow-hidden transform transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3 relative">
            {versionedLogoUrl ? (
              <img src={versionedLogoUrl} alt={name} className="w-full h-full object-cover" onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} />
            ) : (
              name.charAt(0)
            )}
          </div>
        </div>

        {/* Title & Badge */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <Link href={`/clubs/${id}`} className="min-w-0 flex-1">
            <h3 className="font-bold text-foreground text-[15px] leading-tight group-hover:text-primary transition-colors line-clamp-1 truncate">{name}</h3>
          </Link>
          {isVerified && <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" />}
        </div>

        {/* Description */}
        <div className="min-h-[36px] mb-4">
          {description ? (
            <p className="text-[13px] text-foreground/60 line-clamp-2 leading-relaxed">{description}</p>
          ) : (
            <p className="text-[13px] text-foreground/40 italic">Chưa có mô tả</p>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-end justify-between mt-auto pt-2">
          <div className="flex flex-col gap-2">
            <span className="w-fit text-[10px] font-bold tracking-wider uppercase rounded-full bg-primary/10 text-primary px-2.5 py-1 border border-primary/20">
              {type === 'OFFICIAL_CLUB' ? 'CLB Chính thức' : 'Cộng đồng'}
            </span>
            <div className="flex items-center gap-1.5 text-foreground/50 text-[12px] font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>{memberCount.toLocaleString('vi-VN')} <span className="hidden sm:inline">thành viên</span></span>
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              joinMutation.mutate();
            }}
            disabled={joinMutation.isPending}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-300 active:scale-95 flex items-center justify-center min-w-[90px] ${
              isJoined
                ? 'bg-hover text-foreground/70 hover:bg-hover/80 hover:text-foreground border border-border/50'
                : 'bg-primary text-white hover:bg-primary/90 shadow-[0_4px_12px_rgba(var(--primary-rgb),0.25)] hover:shadow-[0_6px_16px_rgba(var(--primary-rgb),0.35)]'
            } disabled:opacity-50 disabled:pointer-events-none`}
          >
            {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isJoined ? 'Đã tham gia' : 'Tham gia'}
          </button>
        </div>
      </div>
    </div>
  );
};
