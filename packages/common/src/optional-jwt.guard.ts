import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtUser } from './jwt-auth.guard';
import { resolveJwtSecret } from './jwt-secret';

/**
 * Optional JWT guard for the backward-compatibility window.
 *
 * Unlike {@link JwtAuthGuard}, this NEVER rejects a request for a missing or
 * invalid token. If a valid Bearer token is present it decodes it and attaches
 * the payload to `req.user`; otherwise it lets the request through with
 * `req.user` unset. Controllers then prefer the token identity via
 * {@link resolveUserId} and fall back to the client-supplied id.
 *
 * This lets us migrate every service to token-based identity without breaking
 * the existing frontend (which does not yet send Authorization headers). Once
 * the frontend attaches tokens, flip services to the strict JwtAuthGuard.
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    const token = this.extractToken(req);

    if (token) {
      try {
        req.user = await this.jwtService.verifyAsync<JwtUser>(token, {
          secret: resolveJwtSecret(),
        });
      } catch {
        // Invalid/expired token in compat mode: ignore and fall through.
      }
    }
    return true;
  }

  private extractToken(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (!header) return undefined;
    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

/**
 * Resolve the acting user id, preferring the verified JWT identity over any
 * client-supplied value. Throws if neither is available.
 *
 * @param tokenUserId  `req.user.sub` from the decoded JWT (via @CurrentUser('sub'))
 * @param fallbackId   id taken from the request body/param (legacy clients)
 */
export function resolveUserId(
  tokenUserId: string | undefined,
  fallbackId?: string | null,
): string {
  const id = tokenUserId || fallbackId;
  if (!id) {
    throw new BadRequestException('Thiếu thông tin người dùng (token hoặc userId).');
  }
  return id;
}
