export { bootstrapService } from './bootstrap';
export type { BootstrapOptions } from './bootstrap';

export { CommonModule } from './common.module';
export type { CommonModuleOptions } from './common.module';

export { RedisModule } from './redis.module';
export { REDIS_CLIENT } from './redis.module';
export type { RedisModuleOptions } from './redis.module';

export { CacheService } from './cache.service';

export { resolveJwtSecret } from './jwt-secret';

export { AllExceptionsFilter } from './all-exceptions.filter';
export { SecurityHeadersMiddleware } from './security-headers.middleware';

export { HealthController } from './health.controller';

export { JwtAuthGuard, Public, CurrentUser, IS_PUBLIC_KEY } from './jwt-auth.guard';
export type { JwtUser } from './jwt-auth.guard';

export { OptionalJwtGuard, resolveUserId } from './optional-jwt.guard';

export { NotificationDispatcher } from './notification-dispatcher';
export type { NotificationPayload } from './notification-dispatcher';

export {
  createStorageProvider,
  LocalStorageProvider,
  validateUpload,
  IMAGE_MIME_WHITELIST,
  VIDEO_MIME_WHITELIST,
  DOCUMENT_MIME_WHITELIST,
} from './storage';
export type {
  StorageProvider,
  StoredFile,
  UploadInput,
  UploadValidationOptions,
} from './storage';

export * from './roles.guard';
export * from './not-suspended.guard';
export * from './verified-user.guard';
export * from './rate-limit.guard';

export {
  parseStudentInfo,
  isCmcStudentEmail,
  MAJOR_MAP,
  CMC_STUDENT_DOMAINS,
} from './student-utils';
export type { StudentInfo } from './student-utils';
