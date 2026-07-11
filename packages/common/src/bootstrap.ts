import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { SecurityHeadersMiddleware } from './security-headers.middleware';
import { logger as createLogger } from '@campus-connect/logger';

export interface BootstrapOptions {
  /** Logical service name, used in logs and the /health payload. */
  serviceName: string;
  /** Port to listen on (falls back to PORT env then this default). */
  port: number;
  /** Optional global route prefix, e.g. 'api/v1' for the gateway. */
  globalPrefix?: string;
  /** Serve a static directory (used by services that store uploads). */
  staticAssets?: { root: string; prefix?: string };
}

function parseOrigins(): string[] | boolean {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || raw.trim() === '') {
    // Dev convenience: allow LAN devices to hit local services.
    if (process.env.NODE_ENV !== 'production') return true;

    return ['http://localhost:25080'];
  }
  if (raw.trim() === '*') return true;
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

/**
 * Centralised, production-ready bootstrap for every NestJS service.
 * Applies: winston logging, security headers, strict CORS, global validation,
 * a standardized exception filter, and graceful shutdown.
 *
 * Note: the global JwtAuthGuard + RateLimitGuard are wired per-service via
 * CommonModule (APP_GUARD) so they can inject Reflector/JwtService.
 */
export async function bootstrapService(
  appModule: any,
  options: BootstrapOptions,
): Promise<NestExpressApplication> {
  process.env.SERVICE_NAME = options.serviceName;
  const log = createLogger(options.serviceName);

  const app = await NestFactory.create<NestExpressApplication>(appModule, {
    // Buffer logs until winston is attached.
    logger: ['error', 'warn', 'log'],
  });

  // Security headers (helmet replacement).
  app.use(new SecurityHeadersMiddleware().use);

  // Strict CORS.
  app.enableCors({
    origin: parseOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global input validation.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Standardized error responses.
  app.useGlobalFilters(new AllExceptionsFilter());

  if (options.globalPrefix) {
    app.setGlobalPrefix(options.globalPrefix);
  }

  if (options.staticAssets) {
    app.useStaticAssets(options.staticAssets.root, {
      prefix: options.staticAssets.prefix,
    });
  }

  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || options.port;
  await app.listen(port, '0.0.0.0');

  log.info(`🚀 ${options.serviceName} listening on port ${port}`);
  new Logger(options.serviceName).log(`Ready on http://localhost:${port}`);

  // --- Graceful shutdown ---
  const shutdown = async (signal: string) => {
    log.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await app.close();
      log.info(`${options.serviceName} closed successfully`);
      process.exit(0);
    } catch (err) {
      log.error(`Error during shutdown: ${(err as Error).message}`);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch uncaught errors to prevent silent crashes.
  process.on('uncaughtException', (err) => {
    log.error(`Uncaught exception: ${err.stack || err.message}`);
  });
  process.on('unhandledRejection', (reason) => {
    log.error(`Unhandled rejection: ${String(reason)}`);
  });

  return app;
}
