import { Controller, Get } from '@nestjs/common';
import { Public } from './jwt-auth.guard';
import { SkipRateLimit } from './rate-limit.guard';

const startedAt = Date.now();

/**
 * Minimal liveness endpoint exposed by every service at /health.
 * Public + not rate limited so load balancers / uptime checks can hit it freely.
 */
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @SkipRateLimit()
  check() {
    return {
      status: 'ok',
      service: process.env.SERVICE_NAME || 'unknown',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
