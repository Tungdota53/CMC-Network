import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaClient } from '@campus-connect/database';
import type { Request } from 'express';
import type { JwtUser } from './jwt-auth.guard';

const prisma = new PrismaClient();

/**
 * Requires an authenticated account with verified email and active status.
 * Must run after JwtAuthGuard.
 */
@Injectable()
export class VerifiedUserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const userId = req.user?.sub;

    if (!userId) {
      return true; // Let JwtAuthGuard handle unauthenticated requests.
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        isVerified: true,
        isSuspended: true,
        banExpiresAt: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('Tài khoản không còn tồn tại.');
    }

    if (!user.emailVerified || !user.isVerified) {
      throw new ForbiddenException('Vui lòng xác thực email sinh viên trước khi dùng chức năng này.');
    }

    if (user.isSuspended) {
      if (user.banExpiresAt && new Date() < user.banExpiresAt) {
        throw new ForbiddenException(`Tài khoản của bạn đã bị khóa đến ${user.banExpiresAt.toLocaleDateString('vi-VN')}.`);
      }
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa vĩnh viễn.');
    }

    return true;
  }
}