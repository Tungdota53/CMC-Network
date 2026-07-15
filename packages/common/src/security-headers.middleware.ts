import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Lightweight security headers middleware (helmet replacement, zero external deps).
 * Sets the most impactful headers for an API + uploaded-file server.
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(self), microphone=(self), geolocation=()',
    );
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=15552000; includeSubDomains',
    );
    // Avoid leaking the framework
    res.removeHeader('X-Powered-By');
    next();
  }
}
