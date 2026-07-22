import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function decodeJwtUserId(token: string | null): string | null {
  if (!token || typeof window === 'undefined') return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded));
    return decoded.sub || decoded.id || null;
  } catch {
    return null;
  }
}

function useCurrentUserId(): string | null {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  if (typeof window === 'undefined') return null;
  const tokenUserId = decodeJwtUserId(localStorage.getItem('auth_token'));
  if (tokenUserId) return tokenUserId;
  if (!hasHydrated) return null;
  return tokenUserId || userId;
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
    queryKey: ['friends', 'list', userId, take],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/friends?take=${take}`);
      return { friends: normalizeList(res.data.data), nextCursor: res.data.data?.nextCursor ?? null };
    },
  });
}

export function useIncomingRequests() {
  const userId = useCurrentUserId();
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'incoming', userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/friends/requests/incoming`);
      return normalizeList(res.data.data);
    },
  });
}

export function useOutgoingRequests() {
  const userId = useCurrentUserId();
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'outgoing', userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/friends/requests/outgoing`);
      return normalizeList(res.data.data);
    },
  });
}

export function useFriendSuggestions() {
  const userId = useCurrentUserId();
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'suggestions', userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/friends/suggestions`);
      return normalizeList(res.data.data);
    },
  });
}

export function useBlockedUsers() {
  const userId = useCurrentUserId();
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'blocked', userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/friends/blocked`);
      return normalizeList(res.data.data);
    },
  });
}

export function useMutualFriends(targetId: string) {
  const userId = useCurrentUserId();
  return useQuery<FriendUser[]>({
    queryKey: ['friends', 'mutual', userId, targetId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/friends/mutual/${targetId}`);
      return normalizeList(res.data.data);
    },
    enabled: !!userId && !!targetId,
  });
}

// ==========================================
// MUTATIONS
// ==========================================
export function useFriendMutations() {
  const qc = useQueryClient();
  const userId = useCurrentUserId();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['friends'] });
  };

  const sendRequest = useMutation({
    mutationFn: async (targetId: string) => api.post(`/users/${userId}/friends/request/${targetId}`),
    onSuccess: invalidateAll,
  });

  const acceptRequest = useMutation({
    mutationFn: async (targetId: string) => api.post(`/users/${userId}/friends/accept/${targetId}`),
    onSuccess: invalidateAll,
  });

  const rejectRequest = useMutation({
    mutationFn: async (targetId: string) => api.post(`/users/${userId}/friends/reject/${targetId}`),
    onSuccess: invalidateAll,
  });

  const cancelRequest = useMutation({
    mutationFn: async (targetId: string) => api.delete(`/users/${userId}/friends/cancel/${targetId}`),
    onSuccess: invalidateAll,
  });

  const removeFriend = useMutation({
    mutationFn: async (targetId: string) => api.delete(`/users/${userId}/friends/${targetId}`),
    onSuccess: invalidateAll,
  });

  const blockUser = useMutation({
    mutationFn: async (targetId: string) => api.post(`/users/${userId}/friends/block/${targetId}`),
    onSuccess: invalidateAll,
  });

  const unblockUser = useMutation({
    mutationFn: async (targetId: string) => api.delete(`/users/${userId}/friends/block/${targetId}`),
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
