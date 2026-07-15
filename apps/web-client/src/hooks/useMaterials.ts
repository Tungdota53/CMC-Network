/**
 * Domain React Query hooks — Materials
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

const hasMaterialId = (id?: string | null) => Boolean(id && id !== 'undefined' && id !== 'null');

export interface Material {
  id: string;
  title: string;
  description: string;
  type: string;
  courseCode: string;
  downloadUrl: string;
  fileSize: number;
  downloadCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
  uploaderName: string;
  createdAt: string;
}

export function useMaterials(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery<Material[]>({
    queryKey: queryKeys.materials.list(),
    queryFn: async () => {
      const res = await api.get('/materials', { params });
      return extractList<Material>(res);
    },
  });
}

export function useMaterial(id: string) {
  return useQuery<Material>({
    queryKey: queryKeys.materials.detail(id),
    queryFn: async () => {
      const res = await api.get(`/materials/${id}`);
      return extractData<Material>(res);
    },
    enabled: hasMaterialId(id),
    retry: false,
  });
}

export function useBookmarkedMaterials() {
  return useQuery<Material[]>({
    queryKey: queryKeys.materials.bookmarks(),
    queryFn: async () => {
      const res = await api.get('/materials/bookmarks');
      return extractList<Material>(res);
    },
  });
}

export function useBookmarkMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/materials/${id}/bookmark`);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}

export function useUnbookmarkMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/materials/${id}/bookmark`);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}

export function useDownloadMaterial() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/materials/${id}/download`);
      return extractData(res);
    },
  });
}