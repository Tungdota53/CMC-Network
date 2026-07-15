/**
 * Domain React Query hooks — Mentors
 *
 * Backend (user-service /mentors):
 *   GET /mentors?expertise           → MentorCard[]
 *   GET /mentors/me                   → MentorDetail (profile + reviews)
 *   GET /mentors/bookings?role        → MentorBooking[]
 *   POST /mentors/me                  → register/update profile
 *   POST /mentors/:id/book            → create booking
 *   PUT /mentors/bookings/:id         → update booking status
 *   POST /mentors/reviews             → review mentor (bookingId, rating, comment)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

export interface Mentor {
  id: string;
  profileId?: string;
  name: string;
  avatar?: string;
  major?: string;
  cohort?: string;
  department?: string;
  bio: string;
  expertise: string[];
  gpa?: number | null;
  rating: number;
  reviewCount: number;
  sessions: number;
  available: boolean;
  status: string;
  schedule?: unknown;
  badges: string[];
}

export interface MentorReview {
  id: string;
  mentorId: string;
  menteeId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  mentee?: { id: string; fullName: string; avatarUrl?: string };
}

export interface MentorDetail extends Omit<Mentor, 'reviewCount'> {
  reviewCount: number;
  reviews?: MentorReview[];
}

export interface MentorBooking {
  id: string;
  mentorId: string;
  menteeId: string;
  scheduledAt: string;
  topic?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  mentor?: { id: string; fullName: string; avatarUrl?: string; major?: string };
  mentee?: { id: string; fullName: string; avatarUrl?: string; major?: string };
}

export function useMentors(params?: { expertise?: string }) {
  return useQuery<Mentor[]>({
    queryKey: [...queryKeys.mentors.list(), params ?? {}],
    queryFn: async () => {
      const res = await api.get('/mentors', { params });
      return extractList<Mentor>(res);
    },
  });
}

export function useMentorDetail(userId: string) {
  return useQuery<MentorDetail>({
    queryKey: queryKeys.mentors.detail(userId),
    queryFn: async () => {
      const res = await api.get(`/mentors/${userId}`);
      return extractData<MentorDetail>(res);
    },
    enabled: !!userId,
  });
}

export function useMentorBookings(role: 'mentor' | 'mentee' = 'mentee') {
  return useQuery<MentorBooking[]>({
    queryKey: [...queryKeys.mentors.sessions(), role],
    queryFn: async () => {
      const res = await api.get('/mentors/bookings', { params: { role } });
      return extractList<MentorBooking>(res);
    },
  });
}

export function useBookMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { mentorId: string; scheduledAt: string; topic?: string; notes?: string }) => {
      const res = await api.post(`/mentors/${data.mentorId}/book`, {
        scheduledAt: data.scheduledAt,
        topic: data.topic,
        notes: data.notes,
      });
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mentors.sessions() });
    },
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bookingId: string; status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' }) => {
      const res = await api.put(`/mentors/bookings/${data.bookingId}`, { status: data.status });
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mentors.sessions() });
    },
  });
}

export function useReviewMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bookingId: string; rating: number; comment?: string }) => {
      const res = await api.post('/mentors/reviews', data);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mentors.all });
    },
  });
}