import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.module';
import type { Redis } from 'ioredis';

/**
 * Small cache helper on top of the shared Redis client.
 *
 * - `getOrSet(key, ttlSeconds, factory)` — cache-aside: returns the cached JSON
 *   value if present, otherwise runs `factory`, stores the result, returns it.
 * - Falls back to a bounded in-memory Map when Redis is unavailable so
 *   single-instance dev keeps working (still gives request de-dup within TTL).
 *
 * Values are JSON-serialised, so store plain data (no class instances).
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger('CacheService');
  private readonly mem = new Map<string, { value: unknown; expiresAt: number }>();
  private readonly MEM_MAX = 1000;

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  private get redisReady(): boolean {
    return !!this.redis && this.redis.status === 'ready';
  }

  private getRedisClient(): Redis | null {
    return this.redisReady ? this.redis : null;
  }

  async get<T>(key: string): Promise<T | null> {
    const redis = this.getRedisClient();
    if (redis) {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const hit = this.mem.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
      this.mem.delete(key);
      return null;
    }
    return hit.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const redis = this.getRedisClient();
    if (redis) {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    }
    // Bound the in-memory map to avoid unbounded growth.
    if (this.mem.size >= this.MEM_MAX) {
      const oldest = this.mem.keys().next().value;
      if (oldest) this.mem.delete(oldest);
    }
    this.mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    const redis = this.getRedisClient();
    if (redis) {
      await redis.del(key);
      return;
    }
    this.mem.delete(key);
  }

  /** Invalidate every key matching a prefix (uses SCAN, not KEYS). */
  async delByPrefix(prefix: string): Promise<void> {
    const redis = this.getRedisClient();
    if (redis) {
      let cursor = '0';
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = next;
        if (keys.length) await redis.del(...keys);
      } while (cursor !== '0');
      return;
    }
    for (const k of this.mem.keys()) {
      if (k.startsWith(prefix)) this.mem.delete(k);
    }
  }

  /** Cache-aside: return cached value or compute, store, and return it. */
  async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await factory();
    // Don't cache null/undefined to avoid poisoning with empty results.
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttlSeconds).catch((err) =>
        this.logger.warn(`cache set failed for ${key}: ${(err as Error).message}`),
      );
    }
    return fresh;
  }
}
