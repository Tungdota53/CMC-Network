/**
 * Domain React Query hooks — Marketplace
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { extractData, extractList } from '@/lib/adapters';
import { queryKeys } from '@/lib/query-keys';

const MARKETPLACE_UPLOAD_PREFIX = '/uploads/products/';

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  location?: string;
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  buyerId?: string;
  createdAt: string;
  updatedAt?: string;
  seller?: { id: string; fullName: string; avatarUrl?: string; createdAt?: string };
}

export interface MarketplaceInput {
  title: string;
  price: number;
  description: string;
  category: string;
  condition: string;
  location?: string;
  images?: string[];
}

export function normalizeProductImageUrl(url?: string | null) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith(MARKETPLACE_UPLOAD_PREFIX)) return trimmed;
  if (trimmed.startsWith('uploads/products/')) return `/${trimmed}`;
  if (trimmed.startsWith('/products/')) return `/uploads${trimmed}`;
  if (trimmed.startsWith('products/')) return `/uploads/${trimmed}`;

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith(MARKETPLACE_UPLOAD_PREFIX)) {
      return parsed.pathname;
    }
  } catch {
    // Keep unsupported relative strings unchanged; backend validation rejects new bad values.
  }

  return trimmed;
}

function normalizeMarketplaceItem(item: MarketplaceItem): MarketplaceItem {
  const images = Array.isArray(item.images)
    ? item.images.map(normalizeProductImageUrl).filter(Boolean)
    : [];
  return { ...item, images };
}

export function useMarketplace(params?: { category?: string; search?: string; status?: string }) {
  return useQuery<MarketplaceItem[]>({
    queryKey: [...queryKeys.marketplace.list(), params ?? {}],
    queryFn: async () => {
      const query: Record<string, string> = {};
      if (params?.category) query.category = params.category;
      if (params?.status) query.status = params.status;
      if (params?.search) query.keyword = params.search;
      const res = await api.get('/marketplace/search', { params: query });
      return extractList<MarketplaceItem>(res).map(normalizeMarketplaceItem);
    },
  });
}

export function useMarketplaceItem(id: string) {
  return useQuery<MarketplaceItem>({
    queryKey: queryKeys.marketplace.detail(id),
    queryFn: async () => {
      const res = await api.get(`/marketplace/${id}`);
      return normalizeMarketplaceItem(extractData<MarketplaceItem>(res));
    },
    enabled: !!id,
  });
}

export function useCreateMarketplaceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MarketplaceInput) => {
      const res = await api.post('/marketplace', data);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.all });
    },
  });
}

export function useUpdateMarketplaceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<MarketplaceInput> & { id: string }) => {
      const res = await api.put(`/marketplace/${id}`, data);
      return extractData(res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.detail(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.all });
    },
  });
}

export function useDeleteMarketplaceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/marketplace/${id}`);
      return extractData(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.all });
    },
  });
}

export function useUpdateMarketplaceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.put(`/marketplace/${id}/status`, { status });
      return extractData(res);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.detail(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.all });
    },
  });
}

export function useBuyProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/marketplace/${id}/buy`);
      return extractData(res);
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.detail(id as string) });
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.all });
    },
  });
}

export function useUploadMarketplaceImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/marketplace/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return extractData<{ url: string }>(res);
    },
  });
}

export function useReportProduct() {
  return useMutation({
    mutationFn: async ({ productId, reason }: { productId: string; reason: string }) => {
      const res = await api.post('/reports', {
        targetId: productId,
        targetType: 'PRODUCT',
        reason,
      });
      return extractData(res);
    },
  });
}