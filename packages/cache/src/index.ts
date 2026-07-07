import Redis, { RedisOptions } from 'ioredis';
import * as net from 'net';

class InMemoryRedis {
  private store = new Map<string, { value: string; expiry?: number }>();
  private listeners: Record<string, Function[]> = {};

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ...args: any[]): Promise<string> {
    let expiry: number | undefined = undefined;
    const exIndex = args.indexOf('EX');
    if (exIndex !== -1 && args[exIndex + 1] !== undefined) {
      const seconds = parseInt(args[exIndex + 1], 10);
      if (!isNaN(seconds)) {
        expiry = Date.now() + seconds * 1000;
      }
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deletedCount = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async keys(pattern: string): Promise<string[]> {
    const regexStr = '^' + pattern.replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexStr);
    const matchedKeys: string[] = [];
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        matchedKeys.push(key);
      }
    }
    return matchedKeys;
  }

  on(event: string, callback: Function): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    if (event === 'connect') {
      process.nextTick(() => callback());
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const callbacks = this.listeners[event];
    if (!callbacks || callbacks.length === 0) return false;
    for (const cb of callbacks) {
      cb(...args);
    }
    return true;
  }

  async quit(): Promise<string> {
    return 'OK';
  }
}

function isPortOpen(host: string, port: number, timeout = 300): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let opened = false;
    
    socket.setTimeout(timeout);
    
    socket.connect(port, host, () => {
      opened = true;
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

let targetClient: any = new InMemoryRedis();
let detectionStarted = false;

async function detectClient(options?: RedisOptions) {
  const host = options?.host || process.env.REDIS_HOST || '127.0.0.1';
  const port = options?.port || parseInt(process.env.REDIS_PORT || '6379', 10);
  
  const isOpen = await isPortOpen(host, port, 300);
  if (isOpen) {
    console.log(`[Cache] Redis port ${port} is open. Connecting to Redis server...`);
    const defaultOptions: RedisOptions = {
      host,
      port,
      password: options?.password || process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
    };
    const realClient = new Redis(options || defaultOptions);
    realClient.on('error', (err) => {
      console.error('[Cache] Redis Client Error:', err.message);
    });
    realClient.on('connect', () => {
      console.log('[Cache] Connected to Redis successfully');
      targetClient = realClient;
    });
  } else {
    console.warn(`[Cache] Redis not available on ${host}:${port}. Falling back to in-memory cache.`);
  }
}

const proxyClient = new Proxy({}, {
  get(target: any, prop: string | symbol) {
    const value = targetClient[prop];
    if (typeof value === 'function') {
      return function (...args: any[]) {
        return value.apply(targetClient, args);
      };
    }
    return value;
  }
});

export const initRedis = (options?: RedisOptions): Redis => {
  if (!detectionStarted) {
    detectionStarted = true;
    detectClient(options).catch((err) => {
      console.error('[Cache] Error detecting Redis:', err);
    });
  }
  return proxyClient as unknown as Redis;
};

export const getRedisClient = (): Redis => {
  return initRedis();
};

export const clearCache = async (pattern: string): Promise<void> => {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(...keys);
  }
};

export default Redis;
