import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

/**
 * Resolve the Socket.IO origin.
 * In the browser we connect to the SAME origin as the page; nginx proxies
 * `/socket.io/` to the chat-service (port 3005). This works in prod behind
 * HTTPS and in dev. An explicit override can be set via NEXT_PUBLIC_CHAT_WS_URL.
 */
function resolveSocketOrigin(): string {
  if (process.env.NEXT_PUBLIC_CHAT_WS_URL) {
    return process.env.NEXT_PUBLIC_CHAT_WS_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3005';
    }
    return window.location.origin;
  }
  return 'http://localhost:3005';
}

function resolveSocketPath(origin: string): string {
  return '/socket.io';
}

/**
 * Module-level singleton socket. Every `useChatSocket()` call shares the SAME
 * connection so we don't open one socket per component (which would cause
 * duplicate event handling, e.g. two incoming-call overlays).
 */
let sharedSocket: Socket | null = null;
let sharedToken: string | null = null;
let refCount = 0;
let socketRefreshPromise: Promise<string | null> | null = null;

async function refreshSocketToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  socketRefreshPromise ??= api.post('/auth/refresh', { refreshToken })
    .then((res) => {
      const nextAccessToken = res.data?.data?.accessToken || res.data?.data?.access_token;
      const nextRefreshToken = res.data?.data?.refreshToken || res.data?.data?.refresh_token;
      if (!nextAccessToken) return null;
      localStorage.setItem('auth_token', nextAccessToken);
      if (nextRefreshToken) localStorage.setItem('refresh_token', nextRefreshToken);
      document.cookie = `auth_token=${nextAccessToken}; path=/; max-age=604800`;
      return nextAccessToken;
    })
    .catch(() => null)
    .finally(() => {
      socketRefreshPromise = null;
    });

  return socketRefreshPromise;
}

function getOrCreateSocket(): Socket | null {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  if (!token) {
    return null;
  }

  // Token changed (login as another user) → recreate.
  if (sharedSocket && sharedToken !== token) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }

  if (sharedSocket) return sharedSocket;

  const origin = resolveSocketOrigin();
  const url = origin + '/chat';
  console.log('[ChatSocket] Connecting to', url);

  sharedToken = token;
  sharedSocket = io(url, {
    path: resolveSocketPath(origin),
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  sharedSocket.on('connect', () => {
    console.log('[ChatSocket] ✅ Connected:', sharedSocket?.id);
  });
  sharedSocket.on('disconnect', (reason) => {
    console.log('[ChatSocket] ❌ Disconnected:', reason);
  });
  sharedSocket.on('connect_error', (err) => {
    console.error('[ChatSocket] Error:', err.message);
    if (err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('unauthorized')) {
      void refreshSocketToken().then((nextToken) => {
        if (!nextToken || !sharedSocket) return;
        sharedToken = nextToken;
        sharedSocket.auth = { token: nextToken };
        sharedSocket.connect();
      });
    }
  });

  sharedSocket.on('unauthorized', () => {
    void refreshSocketToken().then((nextToken) => {
      if (!nextToken || !sharedSocket) return;
      sharedToken = nextToken;
      sharedSocket.auth = { token: nextToken };
      sharedSocket.connect();
    });
  });

  return sharedSocket;
}

/**
 * useChatSocket — returns the shared Socket.IO /chat connection.
 * Returns { socket, isConnected }.
 */
export function useChatSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = getOrCreateSocket();
    if (!s) {
      console.warn('[ChatSocket] No token, skip');
      return;
    }

    refCount += 1;
    setSocket(s);
    setIsConnected(s.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      refCount -= 1;
      // Only tear down the shared socket when nothing uses it anymore.
      if (refCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        sharedToken = null;
        refCount = 0;
      }
    };
  }, []);

  return { socket, isConnected };
}
