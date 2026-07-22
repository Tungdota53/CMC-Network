import { Injectable, Logger } from '@nestjs/common';

export interface NotificationPayload {
  userId: string;
  type: 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPT' | 'SYSTEM' | 'MENTION' | 'MESSAGE';
  content: string;
  relatedId?: string;
}

/**
 * Fire-and-forget realtime notification dispatcher. Any service can call this
 * to push a socket event to the chat-service hub (which owns the Socket.IO
 * server). Persistence is handled separately by the notifications module.
 *
 * The hub URL comes from CHAT_SERVICE_URL (default localhost:38080). Failures
 * are swallowed and logged — a missed realtime ping must never break the
 * originating request.
 */
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private readonly hubUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:38080';

  private getInternalSecret(): string | null {
    const single = process.env.INTERNAL_NOTIFY_SECRET?.trim();
    if (single) return single;

    const firstRotated = (process.env.INTERNAL_NOTIFY_SECRETS || '')
      .split(',')
      .map((secret) => secret.trim())
      .find(Boolean);
    return firstRotated || null;
  }

  async push(payload: NotificationPayload): Promise<void> {
    try {
      const internalSecret = this.getInternalSecret();
      if (!internalSecret) {
        this.logger.warn('Realtime notification push skipped: INTERNAL_NOTIFY_SECRET not configured');
        return;
      }

      await fetch(`${this.hubUrl}/chat/internal/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      this.logger.warn(`Realtime notification push failed: ${(err as Error).message}`);
    }
  }
}
