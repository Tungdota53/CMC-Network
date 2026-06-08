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
 * The hub URL comes from CHAT_SERVICE_URL (default localhost:3005). Failures
 * are swallowed and logged — a missed realtime ping must never break the
 * originating request.
 */
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private readonly hubUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3005';

  async push(payload: NotificationPayload): Promise<void> {
    try {
      await fetch(`${this.hubUrl}/chat/internal/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      this.logger.warn(`Realtime notification push failed: ${(err as Error).message}`);
    }
  }
}
