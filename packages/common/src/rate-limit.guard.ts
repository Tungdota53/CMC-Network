import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

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
 * In-memory sliding-window rate limiter (single-instance). For multi-instance
 * deployments swap the store for Redis, but this is enough to stop abuse/DDoS
 * on a single node and needs no external dependency.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, Counter>();
  private readonly defaults: RateLimitOptions;
  private lastSweep = 0;

  constructor(private readonly reflector: Reflector) {
    this.defaults = {
      limit: Number(process.env.RATE_LIMIT_MAX) || 120,
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    };
  }

  canActivate(context: ExecutionContext): boolean {
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
    const key = `${this.clientIp(req)}:${controller.name}.${handler.name}`;
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
