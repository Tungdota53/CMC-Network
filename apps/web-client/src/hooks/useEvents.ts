/**
 * Domain React Query hooks — Events
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

export interface EventItem {
  id: string;
  organizerId: string;
  title: string;
  description?: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  maxAttendees?: number | null;
  attendeeCount: number;
  status: string;
  qrCodeEnabled?: boolean;
  image?: string | null;
  organizer?: { id: string; fullName: string; avatarUrl?: string; isVerified?: boolean; hasBlueBadge?: boolean };
  attendees?: { id: string; userId: string; status: string; createdAt: string }[];
}

export function useEvents() {
  return useQuery<EventItem[]>({
    queryKey: queryKeys.events.list(),
    queryFn: async () => {
      const res = await api.get('/events');
      return extractList<EventItem>(res);
    },
  });
}

export function useEvent(id: string) {
  return useQuery<EventItem>({
    queryKey: queryKeys.events.detail(id),
    queryFn: async () => {
      const res = await api.get(`/events/${id}`);
      return extractData<EventItem>(res);
    },
    enabled: !!id,
  });
}

export function useJoinEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/events/${id}/join`);
      return extractData(res);
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useLeaveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/events/${id}/join`);
      return extractData(res);
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useCheckInEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/events/${id}/checkin`);
      return extractData(res);
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
    },
  });
}

export function useEventAttendees(id: string) {
  return useQuery({
    queryKey: [...queryKeys.events.detail(id), 'attendees'],
    queryFn: async () => {
      const res = await api.get(`/events/${id}/attendees`);
      return extractList<any>(res);
    },
    enabled: !!id,
  });
}