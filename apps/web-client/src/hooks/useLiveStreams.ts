import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface LiveStreamHost {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  studentId?: string | null;
  isVerified: boolean;
  hasBlueBadge?: boolean;
}

export interface LiveStream {
  id: string;
  hostId: string;
  title: string;
  description?: string | null;
  status: 'LIVE' | 'ENDED';
  startedAt: string;
  endedAt?: string | null;
  host: LiveStreamHost;
}

const unwrap = <T,>(response: { data?: unknown }): T => {
  const outer = response.data as { data?: T } | T;
  return (outer && typeof outer === 'object' && 'data' in outer ? outer.data : outer) as T;
};

export function useLiveStreams() {
  return useQuery<LiveStream[]>({
    queryKey: ['live-streams'],
    queryFn: async () => unwrap<LiveStream[]>(await api.get('/posts/live-streams/active')) ?? [],
    refetchInterval: 15_000,
  });
}

export function useLiveStream(id: string) {
  return useQuery<LiveStream>({
    queryKey: ['live-streams', id],
    queryFn: async () => unwrap<LiveStream>(await api.get(`/posts/live-streams/${encodeURIComponent(id)}`)),
    enabled: Boolean(id),
    refetchInterval: (query) => query.state.data?.status === 'LIVE' ? 15_000 : false,
  });
}

export function useCreateLiveStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string }) =>
      unwrap<LiveStream>(await api.post('/posts/live-streams', input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live-streams'] }),
  });
}

export function useEndLiveStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap<LiveStream>(await api.post(`/posts/live-streams/${encodeURIComponent(id)}/end`)),
    onSuccess: (stream) => {
      queryClient.setQueryData(['live-streams', stream.id], stream);
      queryClient.invalidateQueries({ queryKey: ['live-streams'] });
    },
  });
}