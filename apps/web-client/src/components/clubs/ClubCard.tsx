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
}

export const ClubCard = ({ id, name, description, logoUrl, bannerUrl, type, isVerified, memberCount, isJoined }: ClubCardProps) => {
  const queryClient = useQueryClient();
  const joinMutation = useMutation({
    mutationFn: async () => (isJoined ? api.delete(`/clubs/${id}/join`) : api.post(`/clubs/${id}/join`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', id] });
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
      {/* Banner */}
      <div className="h-24 bg-gradient-to-r from-indigo-400 to-purple-500 relative overflow-hidden">
        {bannerUrl && <Image src={bannerUrl} alt={name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized />}
      </div>

      {/* Logo + name */}
      <div className="px-4 pt-0 pb-4 flex flex-col flex-1">
        <div className="-mt-5 mb-3">
          <div className="w-12 h-12 rounded-xl border-2 border-white shadow-md bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg font-black text-indigo-600">
            {logoUrl ? <Image src={logoUrl} alt={name} width={48} height={48} className="w-full h-full object-cover rounded-xl" unoptimized /> : name.charAt(0)}
          </div>
        </div>

        <div className="flex items-start gap-1.5 mb-1">
          <Link href={`/clubs/${id}`}>
            <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">{name}</h3>
          </Link>
          {isVerified && <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0 mt-0.5" />}
        </div>

        {description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{description}</p>}

        <div className="mb-3">
          <span className="text-[11px] font-bold rounded-full bg-gray-100 text-gray-500 px-2 py-0.5">
            {type === 'OFFICIAL_CLUB' ? 'CLB chính thức' : 'Cộng đồng'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <Users className="w-3.5 h-3.5" /> {memberCount.toLocaleString('vi-VN')} thành viên
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              joinMutation.mutate();
            }}
            disabled={joinMutation.isPending}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${isJoined
              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              : 'bg-primary text-white hover:bg-blue-700'} disabled:opacity-50`}
          >
            {joinMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isJoined ? 'Đã tham gia' : 'Tham gia'}
          </button>
        </div>
      </div>
    </div>
  );
};
