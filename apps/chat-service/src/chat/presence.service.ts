import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { REDIS_CLIENT } from '@campus-connect/common';
import type { Redis } from 'ioredis';

/**
 * Presence registry — Redis-backed for multi-instance, in-memory fallback.
 *
 * Redis keys:
 *   presence:user:{userId}    → SET of socketIds
 *   presence:sockets:{socketId} → userId (string)
 *   presence:typing:{conversationId} → SET of userIds
 *
 * When Redis is unavailable, falls back to in-memory Maps so single-instance
 * dev still works without Redis running.
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger('PresenceService');
  private readonly PRESENCE_PREFIX = 'presence:';

  // In-memory fallback store.
  private readonly memUserSockets = new Map<string, Set<string>>();
  private readonly memSocketUser = new Map<string, string>();
  private readonly memTyping = new Map<string, Set<string>>();

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {
    if (this.redis) {
      this.logger.log('Redis-backed presence active');
    } else {
      this.logger.warn('In-memory presence (no Redis) — single-instance only');
    }
  }

  private get redisReady(): boolean {
    return !!this.redis && this.redis.status === 'ready';
  }

  private getRedisClient(): Redis | null {
    return this.redisReady ? this.redis : null;
  }

  /** Returns true if this is the user's first socket (i.e. they just came online). */
  async add(userId: string, socketId: string): Promise<boolean> {
    const redis = this.getRedisClient();
    if (redis) {
      const key = `${this.PRESENCE_PREFIX}user:${userId}`;
      const existed = await redis.exists(key);
      await redis.sadd(key, socketId);
      await redis.set(`${this.PRESENCE_PREFIX}sockets:${socketId}`, userId);
      // Maintain an O(1)-lookup online set so onlineUserIds() avoids KEYS scan.
      if (existed === 0)
        await redis.sadd(`${this.PRESENCE_PREFIX}online`, userId);
      return existed === 0;
    }

    // In-memory fallback
    this.memSocketUser.set(socketId, userId);
    let set = this.memUserSockets.get(userId);
    const wasOffline = !set || set.size === 0;
    if (!set) {
      set = new Set();
      this.memUserSockets.set(userId, set);
    }
    set.add(socketId);
    return wasOffline;
  }

  /** Removes a socket. Returns { userId, nowOffline } so callers can broadcast. */
  async remove(
    socketId: string,
  ): Promise<{ userId?: string; nowOffline: boolean }> {
    const redis = this.getRedisClient();
    if (redis) {
      const userId = await redis.get(
        `${this.PRESENCE_PREFIX}sockets:${socketId}`,
      );
      if (!userId) return { nowOffline: false };
      await redis.del(`${this.PRESENCE_PREFIX}sockets:${socketId}`);
      const key = `${this.PRESENCE_PREFIX}user:${userId}`;
      await redis.srem(key, socketId);
      const remaining = await redis.scard(key);
      if (remaining === 0) {
        await redis.del(key);
        await redis.srem(`${this.PRESENCE_PREFIX}online`, userId);
        return { userId, nowOffline: true };
      }
      return { userId, nowOffline: false };
    }

    // In-memory fallback
    const userId = this.memSocketUser.get(socketId);
    if (!userId) return { nowOffline: false };
    this.memSocketUser.delete(socketId);
    const set = this.memUserSockets.get(userId);
    if (set) {
      set.delete(socketId);
      if (set.size === 0) {
        this.memUserSockets.delete(userId);
        return { userId, nowOffline: true };
      }
    }
    return { userId, nowOffline: false };
  }

  async isOnline(userId: string): Promise<boolean> {
    const redis = this.getRedisClient();
    if (redis) {
      const count = await redis.scard(`${this.PRESENCE_PREFIX}user:${userId}`);
      return count > 0;
    }
    const set = this.memUserSockets.get(userId);
    return !!set && set.size > 0;
  }

  async onlineUserIds(): Promise<string[]> {
    const redis = this.getRedisClient();
    if (redis) {
      // SMEMBERS on a maintained set — O(N) on set size, not KEYS scan of whole DB.
      return redis.smembers(`${this.PRESENCE_PREFIX}online`);
    }
    return Array.from(this.memUserSockets.keys());
  }

  async setTyping(conversationId: string, userId: string, isTyping: boolean) {
    const redis = this.getRedisClient();
    if (redis) {
      const key = `${this.PRESENCE_PREFIX}typing:${conversationId}`;
      if (isTyping) {
        await redis.sadd(key, userId);
        // Auto-expire typing state after 10s so stale entries don't linger.
        await redis.expire(key, 10);
      } else {
        await redis.srem(key, userId);
      }
      return;
    }

    let set = this.memTyping.get(conversationId);
    if (!set) {
      set = new Set();
      this.memTyping.set(conversationId, set);
    }
    if (isTyping) set.add(userId);
    else set.delete(userId);
  }

  async typingUsers(conversationId: string): Promise<string[]> {
    const redis = this.getRedisClient();
    if (redis) {
      return redis.smembers(`${this.PRESENCE_PREFIX}typing:${conversationId}`);
    }
    return Array.from(this.memTyping.get(conversationId) ?? []);
  }
}
