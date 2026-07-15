/**
 * Domain React Query hooks — Professors
 *
 * Backend (user-service /professors):
 *   GET /professors?search&faculty&sort      → Professor[]
 *   GET /professors/:id                       → Professor + { reviews, difficulty }
 *   GET /professors/:id/reviews               → ProfessorReview[]
 *   POST /professors/:id/reviews              → upsert review (rating, difficulty, subject, content)
 *   PUT /professors/:id/reviews/me             → update my review
 *   DELETE /professors/:id/reviews/me          → delete my review
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

export interface Professor {
  id: string;
  name: string;
  faculty?: string;
  department?: string;
  avatarUrl?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfessorReview {
  id: string;
  professorId: string;
  userId: string;
  rating: number;
  difficulty: number;
  subject?: string;
  content?: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    major?: string;
  };
}

export interface ProfessorDetail extends Professor {
  reviews: ProfessorReview[];
  difficulty: number;
}

export interface ReviewInput {
  rating: number;
  difficulty?: number;
  subject?: string;
  content?: string;
}

export function useProfessors(params?: { search?: string; faculty?: string; sort?: string }) {
  return useQuery<Professor[]>({
    queryKey: [...queryKeys.professors.list(), params ?? {}],
    queryFn: async () => {
      const res = await api.get('/professors', { params });
      return extractList<Professor>(res);
    },
  });
}

export function useProfessor(id: string) {
  return useQuery<ProfessorDetail>({
    queryKey: queryKeys.professors.detail(id),
    queryFn: async () => {
      const res = await api.get(`/professors/${id}`);
      return extractData<ProfessorDetail>(res);
    },
    enabled: !!id,
  });
}

export function useProfessorReviews(professorId: string) {
  return useQuery<ProfessorReview[]>({
    queryKey: queryKeys.professors.reviews(professorId),
    queryFn: async () => {
      const res = await api.get(`/professors/${professorId}/reviews`);
      return extractList<ProfessorReview>(res);
    },
    enabled: !!professorId,
  });
}

export function useUpsertProfessorReview(professorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      const res = await api.post(`/professors/${professorId}/reviews`, input);
      return extractData<ProfessorReview>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.professors.reviews(professorId) });
      qc.invalidateQueries({ queryKey: queryKeys.professors.detail(professorId) });
      qc.invalidateQueries({ queryKey: queryKeys.professors.list() });
    },
  });
}

export function useDeleteProfessorReview(professorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/professors/${professorId}/reviews/me`);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.professors.reviews(professorId) });
      qc.invalidateQueries({ queryKey: queryKeys.professors.detail(professorId) });
      qc.invalidateQueries({ queryKey: queryKeys.professors.list() });
    },
  });
}