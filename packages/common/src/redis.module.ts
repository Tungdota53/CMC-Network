import { DynamicModule, Global, Module, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CacheService } from './cache.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export interface RedisModuleOptions {
  /** Redis URL. Falls back to REDIS_URL env then localhost default. */
  url?: string;
  /** Optional key prefix to namespace keys per service. */
  keyPrefix?: string;
}

/**
 * Global Redis module — provides a shared ioredis client for:
 *  - Socket.IO Redis adapter (cross-instance WebSocket fanout)
 *  - Redis-backed rate limiter (shared counters across instances)
 *  - Redis-backed presence (online status across instances)
 *
 * Falls back to in-memory mode (no-op) when Redis is unavailable so
 * single-instance dev still works without Redis running.
 */
@Global()
@Module({})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('RedisModule');
  private static client: Redis | null = null;

  static forRoot(options: RedisModuleOptions = {}): DynamicModule {
    const url = options.url || process.env.REDIS_URL || 'redis://localhost:6379';
    const keyPrefix = options.keyPrefix || '';

    const redisProvider = {
      provide: REDIS_CLIENT,
      useFactory: () => {
        if (!RedisModule.client) {
          RedisModule.client = new Redis(url, {
            keyPrefix,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            retryStrategy: (times: number) => {
              if (times > 10) {
                // Stop retrying after 10 attempts — app continues without Redis.
                return null;
              }
              return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
          });
          RedisModule.client.on('error', (err) => {
            Logger.warn(
              `Redis connection error — continuing with in-memory fallback where available: ${err.message}`,
              'RedisModule',
            );
          });
        }
        return RedisModule.client;
      },
    };

    return {
      module: RedisModule,
      providers: [redisProvider, CacheService],
      exports: [redisProvider, CacheService],
    };
  }

  async onModuleInit() {
    const client = RedisModule.client;
    if (!client) return;

    try {
      await client.connect();
      this.logger.log('✅ Redis client connected');
    } catch (err) {
      this.logger.warn(
        `⚠️  Redis unavailable — falling back to in-memory mode. Rate limiting & presence will be per-instance. Error: ${(err as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    const client = RedisModule.client;
    if (client && client.status === 'ready') {
      await client.quit();
      this.logger.log('Redis client disconnected');
    }
  }
}
