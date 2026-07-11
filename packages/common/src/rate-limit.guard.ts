import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
  SetMetadata,
  Optional,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { REDIS_CLIENT } from './redis.module';
import type { Redis } from 'ioredis';

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export const RATE_LIMIT_KEY = 'rate_limit_options';

/** Override the default rate limit for a specific route or controller. */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/** Skip rate limiting entirely for a route or controller. */
export const SKIP_RATE_LIMIT_KEY = 'skip_rate_limit';
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);

interface Counter {
  count: number;
  resetAt: number;
}

/**
 * Rate limiter — Redis-backed for multi-instance, in-memory fallback.
 *
 * Redis strategy: INCR + EXPIRE (fixed window). Key format:
 *   ratelimit:{ip}:{controller}.{handler}
 *
 * When Redis is unavailable, falls back to in-memory Map so single-instance
 * dev still works.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger('RateLimitGuard');
  private readonly store = new Map<string, Counter>();
  private readonly defaults: RateLimitOptions;
  private lastSweep = 0;

  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {
    this.defaults = {
      limit: Number(process.env.RATE_LIMIT_MAX) || 120,
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    };
  }

  private get redisReady(): boolean {
    return !!this.redis && this.redis.status === 'ready';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const controller = context.getClass();

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      handler,
      controller,
    ]);
    if (skip) return true;

    const options =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
        handler,
        controller,
      ]) || this.defaults;

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const ip = this.clientIp(req);
    const key = `ratelimit:${ip}:${controller.name}.${handler.name}`;

    if (this.redisReady) {
      return this.checkRedis(key, options, res);
    }

    return this.checkMemory(key, options, res);
  }

  /** Redis fixed-window: INCR + EXPIRE on first hit. */
  private async checkRedis(
    key: string,
    options: RateLimitOptions,
    res: Response,
  ): Promise<boolean> {
    const windowSec = Math.ceil(options.windowMs / 1000);
    const count = await this.redis!.incr(key);

    // Set TTL only on first request in the window.
    if (count === 1) {
      await this.redis!.expire(key, windowSec);
    }

    const remaining = Math.max(0, options.limit - count);
    const resetAt = Math.floor(Date.now() / 1000) + windowSec;

    res.setHeader('X-RateLimit-Limit', String(options.limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetAt));

    if (count > options.limit) {
      const ttl = await this.redis!.ttl(key);
      res.setHeader('Retry-After', String(Math.max(1, ttl)));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau giây lát.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /** In-memory fallback (single-instance). */
  private checkMemory(
    key: string,
    options: RateLimitOptions,
    res: Response,
  ): boolean {
    const now = Date.now();
    this.sweep(now);

    let counter = this.store.get(key);
    if (!counter || counter.resetAt <= now) {
      counter = { count: 0, resetAt: now + options.windowMs };
      this.store.set(key, counter);
    }

    counter.count += 1;
    const remaining = Math.max(0, options.limit - counter.count);

    res.setHeader('X-RateLimit-Limit', String(options.limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(counter.resetAt / 1000)));

    if (counter.count > options.limit) {
      const retryAfter = Math.ceil((counter.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau giây lát.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private clientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  /** Periodically drop expired counters so the map doesn't grow unbounded. */
  private sweep(now: number) {
    if (now - this.lastSweep < 30_000) return;
    this.lastSweep = now;
    for (const [key, counter] of this.store) {
      if (counter.resetAt <= now) this.store.delete(key);
    }
  }
}
