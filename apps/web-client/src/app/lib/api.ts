export const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, '') || '';

export const CHAT_SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL;

export const getChatSocketUrl = () => {
  const configuredUrl = CHAT_SOCKET_URL?.replace(/\/$/, '');
  const fallbackUrl = 'http://localhost:38080';

  if (typeof window === 'undefined') return configuredUrl || fallbackUrl;

  const isLocalConfiguredUrl =
    !configuredUrl || configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1');

  if (!isLocalConfiguredUrl) return configuredUrl;

  return `${window.location.protocol}//${window.location.hostname}:38080`;
};

/**
 * Lấy JWT đang lưu sau khi đăng nhập (login/page.tsx ghi vào localStorage.auth_token).
 * Chỉ chạy phía client; phía server trả null.
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

/**
 * Chuẩn hóa path thành URL gọi backend.
 * - '/api/...'  -> giữ nguyên, đi qua Next.js rewrites (proxy về gateway)
 * - các path khác -> prefix thẳng gateway URL
 */
export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath.startsWith('/api/')) return normalizedPath;
  return `/api${normalizedPath}`;
};

/**
 * fetch có tự đính Authorization: Bearer <token> (BE-002).
 * Không ghi đè header Authorization nếu caller đã tự set.
 * Không tự thêm Content-Type để giữ FormData (upload) hoạt động đúng.
 */
export const apiFetch = (path: string, init: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(apiUrl(path), { ...init, headers });
};
