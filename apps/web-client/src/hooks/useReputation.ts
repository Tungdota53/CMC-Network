/**
 * Domain React Query hooks — Reputation
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

export interface ReputationEntry {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  rank: number;
  badges: string[];
}

export interface ReputationSummary {
  xp: number;
  reputationScore: number;
  level: number;
  rank?: number;
  nextLevelXp: number;
  badges: Array<{
    id: string;
    badge: string;
    name: string;
    description?: string;
    category: string;
    iconName: string;
    isUnlocked: boolean;
    earnedAt?: string;
    progress?: number;
    requiredPoints?: number;
  }>;
  history: Array<{ id: string; action: string; points: number; reason?: string; createdAt: string }>;
  weeklyXp?: number;
}

export function useReputation() {
  return useQuery<ReputationSummary>({
    queryKey: queryKeys.reputation.me(),
    queryFn: async () => {
      const res = await api.get('/reputation/me');
      return extractData<ReputationSummary>(res);
    },
  });
}

export function useLeaderboard() {
  return useQuery<ReputationEntry[]>({
    queryKey: queryKeys.reputation.leaderboard(),
    queryFn: async () => {
      const res = await api.get('/reputation/leaderboard');
      return extractList<ReputationEntry>(res);
    },
  });
}