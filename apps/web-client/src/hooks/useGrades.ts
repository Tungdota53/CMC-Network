/**
 * Domain React Query hooks — Grades / Academics
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

export interface Grade {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  grade: number;
  semester: string;
  letterGrade?: string;
  status?: string;
}

export interface GradeSummary {
  gpa: number;
  totalCredits: number;
  earnedCredits: number;
  semesterCount: number;
}

export function useGrades() {
  return useQuery<Grade[]>({
    queryKey: queryKeys.grades.list(),
    queryFn: async () => {
      const res = await api.get('/grades');
      return extractList<Grade>(res);
    },
  });
}

export function useGradeSummary() {
  return useQuery<GradeSummary>({
    queryKey: queryKeys.grades.summary(),
    queryFn: async () => {
      const res = await api.get('/grades/summary');
      return extractData<GradeSummary>(res);
    },
  });
}

export function useImportGrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Partial<Grade>[]) => {
      const res = await api.post('/grades/import', { rows });
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.grades.all });
    },
  });
}

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/grades/${id}`);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.grades.all });
    },
  });
}