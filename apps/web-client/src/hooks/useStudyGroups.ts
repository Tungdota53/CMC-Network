/**
 * Domain React Query hooks — Study Groups & Requests
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

export interface StudyGroupMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    major?: string;
    cohort?: string;
  };
}

export interface StudyGroup {
  id: string;
  title: string;
  description?: string;
  subject: string;
  type?: 'STUDY' | 'PROJECT' | 'RESEARCH' | 'EXAM_PREP';
  location?: string;
  memberCount: number;
  maxMembers: number;
  status?: 'OPEN' | 'CLOSED' | 'FULL';
  scheduledTime?: string;
  schedule?: string;
  creatorId: string;
  creator?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    isVerified?: boolean;
    hasBlueBadge?: boolean;
  };
  conversationId?: string;
  whiteboardData?: any;
  todoList?: any;
  members?: StudyGroupMember[];
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    major?: string;
    cohort?: string;
  };
  createdAt: string;
}

export interface StudyRequest {
  id: string;
  title: string;
  subject: string;
  description?: string;
  type?: 'FIND_PARTNER' | 'FIND_GROUP' | 'FIND_TUTOR' | 'SHARE_MATERIAL';
  preferredTime?: string;
  preferredLocation?: string;
  status?: 'OPEN' | 'MATCHED' | 'CLOSED';
  userId: string;
  user?: {
    fullName: string;
    avatarUrl?: string;
    major?: string;
    isVerified?: boolean;
    hasBlueBadge?: boolean;
  };
  createdAt: string;
}

export function useStudyGroups() {
  return useQuery<StudyGroup[]>({
    queryKey: queryKeys.studyGroups.list(),
    queryFn: async () => {
      const res = await api.get('/study-groups');
      return extractList<StudyGroup>(res);
    },
  });
}

export function useStudyGroup(id: string) {
  return useQuery<StudyGroup>({
    queryKey: queryKeys.studyGroups.detail(id),
    queryFn: async () => {
      const res = await api.get(`/study-groups/${id}`);
      return extractData<StudyGroup>(res);
    },
    enabled: !!id,
  });
}

export function useCreateStudyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<StudyGroup> & Record<string, unknown>) => {
      const res = await api.post('/study-groups', data);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.all });
    },
  });
}

export function useUpdateStudyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<StudyGroup> & { id: string; userId?: string }) => {
      const res = await api.put(`/study-groups/${id}`, data);
      return extractData(res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.detail(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.all });
    },
  });
}

export function useDeleteStudyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId?: string }) => {
      const res = await api.delete(`/study-groups/${id}`, { data: { userId } });
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.all });
    },
  });
}

/** Request to join a study group */
export function useRequestJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId?: string }) => {
      const res = await api.post(`/study-groups/${groupId}/join-requests`, { userId });
      return extractData(res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.detail(vars.groupId) });
    },
  });
}

/** List pending join requests for a group (creator only) */
export function useJoinRequests(groupId: string) {
  return useQuery<JoinRequest[]>({
    queryKey: queryKeys.studyGroups.joinRequests(groupId),
    queryFn: async () => {
      const res = await api.get(`/study-groups/${groupId}/join-requests`);
      return extractList<JoinRequest>(res);
    },
    enabled: !!groupId,
  });
}

/** Accept or reject a join request (creator only) */
export function useRespondJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      requestId,
      action,
      userId,
    }: {
      groupId: string;
      requestId: string;
      action: 'accept' | 'reject';
      userId?: string;
    }) => {
      const res = await api.put(
        `/study-groups/${groupId}/join-requests/${requestId}`,
        { action, userId },
      );
      return extractData(res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.joinRequests(vars.groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.detail(vars.groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.all });
    },
  });
}

/** Update whiteboard data (any member) */
export function useUpdateWhiteboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      whiteboardData,
      userId,
    }: {
      groupId: string;
      whiteboardData: unknown;
      userId?: string;
    }) => {
      const res = await api.put(`/study-groups/${groupId}/whiteboard`, {
        whiteboardData,
        userId,
      });
      return extractData(res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.detail(vars.groupId) });
    },
  });
}

/** Update todo list (any member) */
export function useUpdateTodoList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      todoList,
      userId,
    }: {
      groupId: string;
      todoList: unknown;
      userId?: string;
    }) => {
      const res = await api.put(`/study-groups/${groupId}/todo-list`, {
        todoList,
        userId,
      });
      return extractData(res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.studyGroups.detail(vars.groupId) });
    },
  });
}

// --- STUDY REQUESTS ---

export function useStudyRequests() {
  return useQuery<StudyRequest[]>({
    queryKey: queryKeys.studyRequests.list(),
    queryFn: async () => {
      const res = await api.get('/study-groups/requests');
      return extractList<StudyRequest>(res);
    },
  });
}

export function useCreateStudyRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<StudyRequest> & { userId?: string }) => {
      const res = await api.post('/study-groups/requests', data);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.studyRequests.all });
    },
  });
}

export function useUpdateStudyRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId, ...data }: Partial<StudyRequest> & { id: string; userId?: string }) => {
      const res = await api.put(`/study-groups/requests/${id}`, { ...data, userId });
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.studyRequests.all });
    },
  });
}

export function useDeleteStudyRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId?: string }) => {
      const res = await api.delete(`/study-groups/requests/${id}`, { data: { userId } });
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.studyRequests.all });
    },
  });
}