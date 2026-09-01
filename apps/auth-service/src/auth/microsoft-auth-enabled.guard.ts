import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class MicrosoftAuthEnabledGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    if (
      process.env.MICROSOFT_AUTH_ENABLED !== 'true' ||
      !process.env.MICROSOFT_CLIENT_ID ||
      !process.env.MICROSOFT_CLIENT_SECRET
    ) {
      throw new ServiceUnavailableException(
        'Đăng nhập Microsoft đang được phát triển',
      );
    }

    return true;
  }
}
