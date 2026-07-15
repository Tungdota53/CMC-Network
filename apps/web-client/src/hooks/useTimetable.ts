/**
 * Domain React Query hooks — Timetable
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

export interface TimetableEvent {
  id: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  lecturer: string;
  note?: string;
}

export function useTimetable() {
  return useQuery<TimetableEvent[]>({
    queryKey: queryKeys.timetable.events(),
    queryFn: async () => {
      const res = await api.get('/timetable');
      return extractList<TimetableEvent>(res);
    },
  });
}

export function useAddTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<TimetableEvent, 'id'>) => {
      const res = await api.post('/timetable', entry);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.timetable.all });
    },
  });
}

export function useUpdateTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TimetableEvent> & { id: string }) => {
      const res = await api.put(`/timetable/${id}`, data);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.timetable.all });
    },
  });
}

export function useDeleteTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/timetable/${id}`);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.timetable.all });
    },
  });
}

export function useBulkImportTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (events: Omit<TimetableEvent, 'id'>[]) => {
      const res = await api.post('/timetable/bulk-import', { events });
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.timetable.all });
    },
  });
}

export function useClassmates() {
  return useQuery({
    queryKey: queryKeys.timetable.classmates(),
    queryFn: async () => {
      const res = await api.get('/timetable/classmates');
      return extractList(res);
    },
  });
}

export function useFreeSlotComparison() {
  return useQuery({
    queryKey: queryKeys.timetable.freeSlots(),
    queryFn: async () => {
      const res = await api.get('/timetable/free-slots');
      return extractData(res);
    },
  });
}