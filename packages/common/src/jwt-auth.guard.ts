import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { resolveJwtSecret } from './jwt-secret';

export const IS_PUBLIC_KEY = 'is_public';
/** Mark a route or controller as accessible without a valid JWT. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface JwtUser {
  sub: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

/** Inject the authenticated user (decoded JWT payload) into a handler param. */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const user = req.user;
    return data && user ? user[data] : user;
  },
);

/**
 * Verifies the Bearer token using the shared JWT secret. Routes opt out with
 * @Public(). Keep the secret in JWT_SECRET env across all services.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Bạn cần đăng nhập để tiếp tục.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtUser>(token, {
        secret: resolveJwtSecret(),
      });
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
    }
  }

  private extractToken(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (header) {
      const [type, token] = header.split(' ');
      if (type === 'Bearer') return token;
    }

    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;
    const accessCookie = cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('access_token='));
    return accessCookie
      ? decodeURIComponent(accessCookie.slice('access_token='.length))
      : undefined;
  }
}
