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
 * Checks if the user is suspended or banned.
 * Must run after JwtAuthGuard.
 */
@Injectable()
export class NotSuspendedGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const userId = req.user?.sub;

    if (!userId) {
      return true; // Let JwtAuthGuard handle unauthenticated requests
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuspended: true, banExpiresAt: true },
    });

    if (!user) return true;

    if (user.isSuspended) {
      if (user.banExpiresAt && new Date() < user.banExpiresAt) {
        throw new ForbiddenException(`Tài khoản của bạn đã bị khóa đến ${user.banExpiresAt.toLocaleDateString('vi-VN')}.`);
      } else if (!user.banExpiresAt) {
        throw new ForbiddenException('Tài khoản của bạn đã bị khóa vĩnh viễn.');
      }
    }

    return true;
  }
}
