import { Controller, Get } from '@nestjs/common';
import { Public } from './jwt-auth.guard';
import { SkipRateLimit } from './rate-limit.guard';

const startedAt = Date.now();

/**
 * Minimal liveness endpoint exposed by every service at /health.
 * Public + not rate limited so load balancers / uptime checks can hit it freely.
 *
 * /health        — liveness (is the process alive?)
 * /health/ready  — readiness (is the service ready to accept traffic?)
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

  @Get('ready')
  @Public()
  @SkipRateLimit()
  ready() {
    return {
      status: 'ready',
      service: process.env.SERVICE_NAME || 'unknown',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
