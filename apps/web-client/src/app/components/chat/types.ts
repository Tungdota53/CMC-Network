export type User = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  role?: string;
  isVerified?: boolean;
  major?: string;
  cohort?: string;
};

export type Reaction = {
  emoji: string;
  userId: string;
  userName?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  messageType?: string;
  mediaUrl?: string;
  sender?: User;
  // New fields for enhanced features
  replyToId?: string;
  replyTo?: Message;
  reactions?: Reaction[];
  forwardedFrom?: { senderName: string; conversationTitle?: string };
};

export type Conversation = {
  id: string;
  type: 'DIRECT' | 'GROUP';
  title: string;
  avatarUrl?: string | null;
  otherMembers: Array<{ userId: string; user: User }>;
  lastMessage: Message | null;
  messages?: Message[];
  unreadCount?: number;
  updatedAt: string;
  backgroundUrl?: string | null;
  isPinned?: boolean;
};
