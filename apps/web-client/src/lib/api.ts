import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types/api';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

function setAuthCookies(accessToken: string, refreshToken?: string | null) {
  document.cookie = `auth_token=${accessToken}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Lax`;
  if (refreshToken) {
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${REFRESH_TOKEN_MAX_AGE}; SameSite=Lax`;
  }
}

function clearAuthStorage() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub || decoded.id || null;
  } catch (e) {
    return null;
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    const userId = getUserIdFromToken(token);
    const method = (config.method || 'get').toLowerCase();

    if (
      userId &&
      ['post', 'put', 'patch', 'delete'].includes(method) &&
      typeof config.url === 'string' &&
      config.url.startsWith('/posts') &&
      !(config.data instanceof FormData)
    ) {
      config.data = { ...(config.data || {}), userId: config.data?.userId || userId };
    }

    if (config.url) {
      if (config.url.startsWith('/feed')) {
        config.url = config.url.replace('/feed', '/posts/feed');
      } else if (config.url.startsWith('/stories/feed')) {
        config.url = config.url.replace('/stories/feed', '/posts/stories');
      } else if (config.url.startsWith('/stories/my')) {
        config.url = config.url.replace('/stories/my', '/posts/stories');
      } else if (config.url === '/stories') {
        config.url = '/posts/stories';
      } else if (config.url.match(/^\/stories\/([^\/]+)\/view/)) {
        config.url = config.url.replace(/^\/stories\/([^\/]+)\/view/, '/posts/stories/$1/view');
      } else if (config.url.startsWith('/comments')) {
        config.url = config.url.replace('/comments', '/posts/comments');
      } else if (config.url.startsWith('/friends')) {
        if (userId) {
          config.url = config.url.replace('/friends', `/users/${userId}/friends`);
        }
      } else if (config.url.startsWith('/conversations')) {
        if (config.url === '/conversations') {
          if (method === 'post') {
            // Create/get a conversation from { type, participantIds }.
            config.url = '/chat/conversations/from-participants';
          } else {
            // List the current user's conversations from token-authenticated backend route.
            config.url = '/chat/conversations';
          }
        } else if (config.url.startsWith('/conversations/search')) {
          // Search current user's conversations.
          config.url = config.url.replace('/conversations/search', '/chat/conversations/search');
        } else if (config.url.match(/^\/conversations\/([^\/]+)\/state$/)) {
          // Persist per-user conversation state (pin/mute/archive/read position).
          config.url = config.url.replace(/^\/conversations\/([^\/]+)\/state$/, '/chat/conversations/$1/state');
        } else if (config.url.match(/^\/conversations\/([^\/]+)\/messages/)) {
          // GET history + POST send both map to /chat/messages/:id.
          config.url = config.url.replace(/^\/conversations\/([^\/]+)\/messages/, '/chat/messages/$1');
        } else if (config.url.match(/^\/conversations\/([^\/]+)$/)) {
          // Single conversation detail.
          config.url = config.url.replace(/^\/conversations\/([^\/]+)$/, '/chat/conversations/by-id/$1');
        }
      } else if (config.url.startsWith('/professors/search')) {
        config.url = config.url.replace('/professors/search', '/professors');
      } else if (config.url.startsWith('/notifications')) {
        if (config.url.includes('read-all')) {
          config.url = `/notifications/${userId}/read-all`;
          config.method = 'post';
        } else if (config.url.match(/^\/notifications\/([^\/]+)\/read/)) {
          const notifId = config.url.split('/')[2];
          config.url = `/notifications/${userId}/${notifId}/read`;
          config.method = 'post';
        } else if (config.url === '/notifications' && userId) {
          // GET danh sách thông báo: gắn userId fallback cho backend.
          config.url = `/notifications?userId=${userId}`;
        }
      } else if (config.url === '/grades' || config.url?.startsWith('/grades/summary')) {
        if (method === 'get' && userId && !config.url.includes('userId=')) {
          config.params = { ...(config.params || {}), userId };
        }
      } else if (config.url === '/timetable' || config.url === '/timetable/current') {
        config.url = '/timetable/events';
        if (method === 'get' && userId) {
          config.params = { ...(config.params || {}), userId };
        }
      } else if (config.url === '/timetable/events' || config.url === '/timetable/classmates') {
        if (method === 'get' && userId) {
          config.params = { ...(config.params || {}), userId };
        }
      } else if (config.url === '/timetable/bulk-import') {
        config.url = '/timetable/import';
      } else if (config.url?.match(/^\/timetable\/(?!events$|classmates$|free-slots$)[^/]+$/)) {
        config.url = config.url.replace('/timetable/', '/timetable/events/');
        if (method === 'get' && userId) {
          config.params = { ...(config.params || {}), userId };
        }
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Adapter to map CMC-Network backend responses to CMC-Campus frontend expectations
    if (response.data) {
      if (response.data.access_token && !response.data.accessToken) {
        response.data.accessToken = response.data.access_token;
      }
      if (response.data.token && !response.data.accessToken) {
        response.data.accessToken = response.data.token;
      }
      
      // Wrap data if it is not already wrapped in { data: ... }
      if (response.data.data === undefined) {
        response.data = { data: response.data };
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthEndpoint = typeof originalConfig?.url === 'string' && originalConfig.url.startsWith('/auth/');

    if (error.response?.status === 401 && originalConfig && !originalConfig._retry && !isAuthEndpoint) {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refreshToken) {
        originalConfig._retry = true;
        refreshPromise ??= api.post('/auth/refresh', { refreshToken })
          .then((res) => {
            const nextAccessToken = res.data?.data?.accessToken || res.data?.data?.access_token;
            const nextRefreshToken = res.data?.data?.refreshToken || res.data?.data?.refresh_token;
            if (!nextAccessToken) return null;
            localStorage.setItem('auth_token', nextAccessToken);
            if (nextRefreshToken) localStorage.setItem('refresh_token', nextRefreshToken);
            setAuthCookies(nextAccessToken, nextRefreshToken || refreshToken);
            return nextAccessToken;
          })
          .catch(() => {
            clearAuthStorage();
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });

        const nextToken = await refreshPromise;
        if (nextToken) {
          originalConfig.headers.Authorization = `Bearer ${nextToken}`;
          return api(originalConfig);
        }
      }

        if (typeof window !== 'undefined') {
          clearAuthStorage();
          // window.location.href = '/login'; // Let components handle redirect
        }
    }
    return Promise.reject(error.response?.data || error);
  },
);

export default api;
