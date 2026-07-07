export type User = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  role?: string;
  isVerified?: boolean;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: string;
  sender?: User;
};

export type Conversation = {
  id: string;
  type: 'DIRECT' | 'GROUP';
  title: string;
  avatarUrl?: string | null;
  otherMembers: Array<{ userId: string; user: User }>;
  lastMessage: Message | null;
  messages?: Message[];
  updatedAt: string;
};
