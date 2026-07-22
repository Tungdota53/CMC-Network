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
let reconnectAfterTokenRefresh = false;

function isTokenExpiring(token: string | null, skewMs = 30_000): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return !!payload.exp && payload.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return true;
  }
}

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

async function ensureFreshSocketToken(): Promise<string | null> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  if (!isTokenExpiring(token)) return token;
  return refreshSocketToken();
}

function reconnectWithFreshToken(socket: Socket) {
  if (reconnectAfterTokenRefresh) return;
  reconnectAfterTokenRefresh = true;
  void refreshSocketToken().then((nextToken) => {
    reconnectAfterTokenRefresh = false;
    if (!nextToken || sharedSocket !== socket) return;
    sharedToken = nextToken;
    socket.auth = { token: nextToken };
    socket.connect();
  });
}

function createSocket(token: string): Socket {
  const origin = resolveSocketOrigin();
  const url = origin + '/chat';
  console.log('[ChatSocket] Connecting to', url);

  sharedToken = token;
  const socket = io(url, {
    path: resolveSocketPath(origin),
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  const refreshBeforeExpiry = () => {
    if (isTokenExpiring(sharedToken, 60_000)) reconnectWithFreshToken(socket);
  };
  const refreshTimer = window.setInterval(refreshBeforeExpiry, 60_000);

  socket.on('connect', () => {
    console.log('[ChatSocket] ✅ Connected:', socket.id);
    refreshBeforeExpiry();
  });
  socket.on('disconnect', (reason) => {
    console.log('[ChatSocket] ❌ Disconnected:', reason);
    if (reason === 'io server disconnect') reconnectWithFreshToken(socket);
  });
  socket.on('connect_error', (err) => {
    console.error('[ChatSocket] Error:', err.message);
    if (err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('unauthorized')) {
      reconnectWithFreshToken(socket);
    }
  });

  socket.on('unauthorized', () => reconnectWithFreshToken(socket));
  socket.on('destroy', () => window.clearInterval(refreshTimer));

  return socket;
}

function getOrCreateSocket(token: string): Socket | null {
  if (!token) return null;

  // Token changed (login as another user) → recreate.
  if (sharedSocket && sharedToken !== token) {
    sharedSocket.disconnect();
    sharedSocket.emit('destroy');
    sharedSocket = null;
  }

  if (sharedSocket) return sharedSocket;

  sharedSocket = createSocket(token);
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
    let mounted = true;
    let attachedSocket: Socket | null = null;
    let onConnect: (() => void) | null = null;
    let onDisconnect: (() => void) | null = null;

    void ensureFreshSocketToken().then((token) => {
      if (!mounted) return;
      const s = token ? getOrCreateSocket(token) : null;
      if (!s) {
        console.warn('[ChatSocket] No token, skip');
        return;
      }

      refCount += 1;
      attachedSocket = s;
      setSocket(s);
      setIsConnected(s.connected);

      onConnect = () => setIsConnected(true);
      onDisconnect = () => setIsConnected(false);
      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);
    });

    return () => {
      mounted = false;
      if (attachedSocket && onConnect && onDisconnect) {
        attachedSocket.off('connect', onConnect);
        attachedSocket.off('disconnect', onDisconnect);
        refCount -= 1;
      }
      // Only tear down the shared socket when nothing uses it anymore.
      if (refCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket.emit('destroy');
        sharedSocket = null;
        sharedToken = null;
        refCount = 0;
      }
    };
  }, []);

  return { socket, isConnected };
}
