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
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  rules?: string | null;
  tags?: string[];
  location?: string | null;
  contactEmail?: string | null;
  socialLinks?: Record<string, string> | null;
  members?: Array<{
    id: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
    joinedAt: string;
    user?: { id: string; fullName: string; avatarUrl?: string | null; major?: string | null; department?: string | null };
  }>;
  createdAt: string;
  updatedAt?: string;
}

export type UpdateClubPayload = Partial<Pick<Club, 'name' | 'description' | 'category' | 'type' | 'visibility' | 'joinMode' | 'rules' | 'tags' | 'location' | 'contactEmail' | 'socialLinks'>>;

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

export function useUpdateClub(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateClubPayload) => {
      const res = await api.put(`/clubs/${id}`, payload);
      return extractData<Club>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clubs.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}

export function useRemoveClubMember(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await api.delete(`/clubs/${id}/members/${memberId}`);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clubs.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}

export function useDeleteClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/clubs/${id}`);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}