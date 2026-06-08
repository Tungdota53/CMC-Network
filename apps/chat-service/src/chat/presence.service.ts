import { Injectable } from '@nestjs/common';

/**
 * In-memory presence registry mapping userId -> set of active socket ids.
 * A user is "online" while they have at least one connected socket.
 *
 * Note: in-memory means presence is per-instance. For multi-instance
 * deployments back this with Redis (socket.io-redis adapter + shared store).
 */
@Injectable()
export class PresenceService {
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly socketUser = new Map<string, string>();
  private readonly typing = new Map<string, Set<string>>(); // conversationId -> userIds

  /** Returns true if this is the user's first socket (i.e. they just came online). */
  add(userId: string, socketId: string): boolean {
    this.socketUser.set(socketId, userId);
    let set = this.userSockets.get(userId);
    const wasOffline = !set || set.size === 0;
    if (!set) {
      set = new Set();
      this.userSockets.set(userId, set);
    }
    set.add(socketId);
    return wasOffline;
  }

  /** Removes a socket. Returns { userId, nowOffline } so callers can broadcast. */
  remove(socketId: string): { userId?: string; nowOffline: boolean } {
    const userId = this.socketUser.get(socketId);
    if (!userId) return { nowOffline: false };
    this.socketUser.delete(socketId);
    const set = this.userSockets.get(userId);
    if (set) {
      set.delete(socketId);
      if (set.size === 0) {
        this.userSockets.delete(userId);
        return { userId, nowOffline: true };
      }
    }
    return { userId, nowOffline: false };
  }

  isOnline(userId: string): boolean {
    const set = this.userSockets.get(userId);
    return !!set && set.size > 0;
  }

  onlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  setTyping(conversationId: string, userId: string, isTyping: boolean) {
    let set = this.typing.get(conversationId);
    if (!set) {
      set = new Set();
      this.typing.set(conversationId, set);
    }
    if (isTyping) set.add(userId);
    else set.delete(userId);
  }

  typingUsers(conversationId: string): string[] {
    return Array.from(this.typing.get(conversationId) ?? []);
  }
}
