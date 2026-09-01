import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types/api';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<boolean> | null = null;

function getPersistedUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('cc-auth') || '{}')?.state?.user?.id || null;
  } catch {
    return null;
  }
}

function userIdRequired(endpoint: string) {
  return new axios.AxiosError(
    `USER_ID_REQUIRED: ${endpoint}`,
    'USER_ID_REQUIRED',
  );
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    const userId = getPersistedUserId();
    const method = (config.method || 'get').toLowerCase();

    if (
      userId &&
      ['post', 'put', 'patch', 'delete'].includes(method) &&
      typeof config.url === 'string' &&
      config.url.startsWith('/posts') &&
      !config.url.startsWith('/posts/live-streams') &&
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
        if (!userId) return Promise.reject(userIdRequired(config.url));
        config.url = config.url.replace('/friends', `/users/${userId}/friends`);
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
          if (!userId) return Promise.reject(userIdRequired(config.url));
          config.url = `/notifications/${userId}/read-all`;
          config.method = 'post';
        } else if (config.url.match(/^\/notifications\/([^\/]+)\/read/)) {
          if (!userId) return Promise.reject(userIdRequired(config.url));
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
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response;
    }

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
      originalConfig._retry = true;
      refreshPromise ??= api.post('/auth/refresh')
        .then(() => true)
        .catch(() => false)
        .finally(() => {
          refreshPromise = null;
        });

      if (await refreshPromise) {
        return api(originalConfig);
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('cc-auth');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);

export default api;
