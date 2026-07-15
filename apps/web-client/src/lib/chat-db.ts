import Dexie, { Table } from 'dexie';

export interface CachedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  metadata?: any;
  createdAt: string; // ISO String for ordering
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'SEEN' | 'ERROR';
}

export interface CachedConversation {
  id: string;
  name: string;
  lastMessageAt: string;
  unreadCount: number;
  metadata?: any;
}

export interface SyncState {
  key: string;
  lastSyncAt: string;
}

export class ChatDatabase extends Dexie {
  messages!: Table<CachedMessage>;
  conversations!: Table<CachedConversation>;
  syncState!: Table<SyncState>;

  constructor() {
    super('CMCCampusChatDB');
    this.version(1).stores({
      messages: 'id, conversationId, createdAt, [conversationId+createdAt]',
      conversations: 'id, lastMessageAt',
      syncState: 'key',
    });
  }
}

// Singleton instance
export const chatDB = new ChatDatabase();
