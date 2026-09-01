import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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
let refCount = 0;
let refreshPromise: Promise<boolean> | null = null;

export function shouldRefreshSessionAfterDisconnect(reason: string): boolean {
  return reason === 'io server disconnect';
}

async function refreshSession(): Promise<boolean> {
  refreshPromise ??= fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function createSocket(): Socket {
  const origin = resolveSocketOrigin();
  const url = origin + '/chat';
  console.log('[ChatSocket] Connecting to', url);

  const socket = io(url, {
    path: resolveSocketPath(origin),
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('[ChatSocket] ✅ Connected:', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.log('[ChatSocket] ❌ Disconnected:', reason);
    // Server disconnect means handshake authentication failed. Socket.IO will
    // not reconnect automatically in this case. Refresh cookie once before a
    // retry; reconnecting immediately with the same expired token loops forever.
    if (shouldRefreshSessionAfterDisconnect(reason)) {
      void refreshSession().then((refreshed) => {
        if (refreshed && sharedSocket === socket && !socket.connected) {
          socket.connect();
        }
      });
    }
  });
  socket.on('connect_error', (err) => {
    console.error('[ChatSocket] Error:', err.message);
  });

  return socket;
}

function getOrCreateSocket(): Socket {
  if (sharedSocket) return sharedSocket;
  sharedSocket = createSocket();
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

    if (mounted) {
      const s = getOrCreateSocket();

      refCount += 1;
      attachedSocket = s;
      setSocket(s);
      setIsConnected(s.connected);

      onConnect = () => setIsConnected(true);
      onDisconnect = () => setIsConnected(false);
      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);
    }

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
        refCount = 0;
      }
    };
  }, []);

  return { socket, isConnected };
}
