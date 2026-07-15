/**
 * Domain React Query hooks — Clubs
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

export interface Club {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  type: 'OFFICIAL_CLUB' | 'COMMUNITY';
  isVerified: boolean;
  memberCount: number;
  ownerId: string;
  ownerName?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isJoined: boolean;
  isMember?: boolean;
  myRole?: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | null;
  myJoinRequestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  joinMode?: 'OPEN' | 'APPROVAL' | 'INVITE_ONLY';
  members?: Array<{
    id: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
    joinedAt: string;
    user?: { id: string; fullName: string; avatarUrl?: string | null; major?: string | null };
  }>;
  createdAt: string;
}

export function useClubs() {
  return useQuery<Club[]>({
    queryKey: queryKeys.clubs.list(),
    queryFn: async () => {
      const res = await api.get('/clubs');
      return extractList<Club>(res);
    },
  });
}

export function useClub(id: string) {
  return useQuery<Club>({
    queryKey: queryKeys.clubs.detail(id),
    queryFn: async () => {
      const res = await api.get(`/clubs/${id}`);
      return extractData<Club>(res);
    },
    enabled: !!id,
  });
}

export function useJoinClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/clubs/${id}/join`);
      return extractData(res);
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.clubs.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}

export function useLeaveClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/clubs/${id}/join`);
      return extractData(res);
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.clubs.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}