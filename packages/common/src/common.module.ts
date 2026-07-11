import { Module, DynamicModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtGuard } from './optional-jwt.guard';
import { RolesGuard } from './roles.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { HealthController } from './health.controller';
import { resolveJwtSecret } from './jwt-secret';
import { RedisModule } from './redis.module';

export interface CommonModuleOptions {
  /**
   * When true, every route requires a valid JWT unless marked @Public().
   * Default true. Set false for services that are fully public (rare).
   */
  enableAuth?: boolean;
  /**
   * When true (and enableAuth is false), decodes a Bearer token if present and
   * attaches it to req.user, but never rejects. Used during the
   * backward-compatibility window so controllers can prefer token identity
   * while legacy clients (no Authorization header) keep working.
   */
  optionalAuth?: boolean;
  /** When true, applies the in-memory rate limiter globally. Default true. */
  enableRateLimit?: boolean;
}

/**
 * Drop-in module that registers the shared /health endpoint and (optionally)
 * global JWT auth, role, and rate-limit guards. Import once per service:
 *
 *   imports: [CommonModule.register({ enableAuth: true })]
 */
@Module({})
export class CommonModule {
  static register(options: CommonModuleOptions = {}): DynamicModule {
    const {
      enableAuth = true,
      optionalAuth = false,
      enableRateLimit = true,
    } = options;

    const providers = [] as any[];

    if (enableRateLimit) {
      providers.push({ provide: APP_GUARD, useClass: RateLimitGuard });
    }
    if (enableAuth) {
      providers.push({ provide: APP_GUARD, useClass: JwtAuthGuard });
      providers.push({ provide: APP_GUARD, useClass: RolesGuard });
    } else if (optionalAuth) {
      // Compat mode: decode token if present, never reject.
      providers.push({ provide: APP_GUARD, useClass: OptionalJwtGuard });
    }

    // Always register a global JwtModule so JwtService is available both for
    // signing (auth-service) and for route-level @UseGuards(JwtAuthGuard) on
    // admin endpoints — even when global auth is off. Services should NOT
    // register their own JwtModule to avoid a duplicate provider.
    return {
      module: CommonModule,
      global: true,
      imports: [
        RedisModule.forRoot(),
        JwtModule.register({
          global: true,
          secret: resolveJwtSecret(),
          signOptions: {
            expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
          },
        }),
      ],
      controllers: [HealthController],
      providers: [...providers, JwtAuthGuard, OptionalJwtGuard, RolesGuard],
      exports: [JwtModule, JwtAuthGuard, RolesGuard],
    };
  }
}
