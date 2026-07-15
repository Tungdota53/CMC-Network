import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function useCurrentUserId(): string | null {
  return useAuthStore((state) => state.user?.id ?? null);
}

// ==========================================
// TYPES
// ==========================================
export interface FriendUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  profileSlug: string;
  facultyId: string | null;
  majorId: string | null;
  academicYear: string | null;
  requestedAt?: string; // Cho các danh sách request
  mutualCount?: number; // Cho danh sách suggestion
}

export interface GetFriendsResponse {
  friends: FriendUser[];
  nextCursor: string | null;
}

function normalizeUser(user: any): FriendUser {
  const u = user?.sender || user?.receiver || user?.blocked || user;
  return {
    id: u.id,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl ?? null,
    profileSlug: u.profileSlug || u.id,
    facultyId: u.facultyId ?? null,
    majorId: u.majorId ?? u.major ?? null,
    academicYear: u.academicYear ?? u.cohort ?? null,
    requestedAt: user?.createdAt,
    mutualCount: u.mutualCount,
  };
}

function normalizeList(data: any): FriendUser[] {
  const list = Array.isArray(data) ? data : data?.friends || data?.items || [];
  return list.map(normalizeUser).filter((u: FriendUser) => u.id);
}

// ==========================================
// QUERIES
// ==========================================
export function useFriends(take = 20) {
  const userId = useCurrentUserId();
  // TODO: Tạm dùng useQuery thường, sẽ nâng cấp lên useInfiniteQuery nếu cần
  return useQuery<GetFriendsResponse>({
    queryKey: ['friends', 'list'],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get(`/friends?take=${take}`);
      return { friends: normalizeList(res.data.data), nextCursor: res.data.data?.nextCursor ?? null };
    },
  });
}

export function useIncomingRequests() {
  const userId = useCurrentUserId();
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'incoming'],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get('/friends/requests/incoming');
      return normalizeList(res.data.data);
    },
  });
}

export function useOutgoingRequests() {
  const userId = useCurrentUserId();
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'outgoing'],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get('/friends/requests/outgoing');
      return normalizeList(res.data.data);
    },
  });
}

export function useFriendSuggestions() {
  const userId = useCurrentUserId();
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'suggestions'],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get('/friends/suggestions');
      return normalizeList(res.data.data);
    },
  });
}

export function useBlockedUsers() {
  const userId = useCurrentUserId();
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'blocked'],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get('/friends/blocked');
      return normalizeList(res.data.data);
    },
  });
}

export function useMutualFriends(targetId: string) {
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'mutual', targetId],
    queryFn: async () => {
      const res = await api.get(`/friends/mutual/${targetId}`);
      return normalizeList(res.data.data);
    },
    enabled: !!targetId,
  });
}

// ==========================================
// MUTATIONS
// ==========================================
export function useFriendMutations() {
  const qc = useQueryClient();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['friends'] });
  };

  const sendRequest = useMutation({
    mutationFn: async (targetId: string) => api.post(`/friends/request/${targetId}`),
    onSuccess: invalidateAll,
  });

  const acceptRequest = useMutation({
    mutationFn: async (targetId: string) => api.post(`/friends/accept/${targetId}`),
    onSuccess: invalidateAll,
  });

  const rejectRequest = useMutation({
    mutationFn: async (targetId: string) => api.post(`/friends/reject/${targetId}`),
    onSuccess: invalidateAll,
  });

  const cancelRequest = useMutation({
    mutationFn: async (targetId: string) => api.delete(`/friends/cancel/${targetId}`),
    onSuccess: invalidateAll,
  });

  const removeFriend = useMutation({
    mutationFn: async (targetId: string) => api.delete(`/friends/${targetId}`),
    onSuccess: invalidateAll,
  });

  const blockUser = useMutation({
    mutationFn: async (targetId: string) => api.post(`/friends/block/${targetId}`),
    onSuccess: invalidateAll,
  });

  const unblockUser = useMutation({
    mutationFn: async (targetId: string) => api.delete(`/friends/block/${targetId}`),
    onSuccess: invalidateAll,
  });

  return {
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
    blockUser,
    unblockUser,
  };
}
