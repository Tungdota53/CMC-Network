import { ChatService } from './chat.service';
import { prisma } from '@campus-connect/database';

jest.mock('@campus-connect/database', () => ({
  prisma: {
    conversation: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    conversationMember: {
      findMany: jest.fn(),
    },
  },
}));

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService();
  });

  it('returns an existing direct conversation with the same two members', async () => {
    const conversation = {
      id: 'conversation-1',
      members: [{ userId: 'user-1' }, { userId: 'user-2' }],
    };

    jest.mocked(prisma.conversation.findMany).mockResolvedValue([conversation] as never);

    await expect(service.getOrCreateDirectConversation('user-1', 'user-2')).resolves.toBe(conversation);
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('creates a direct conversation when no two-member match exists', async () => {
    const created = {
      id: 'conversation-2',
      members: [{ userId: 'user-1' }, { userId: 'user-3' }],
    };

    jest.mocked(prisma.conversation.findMany).mockResolvedValue([
      { id: 'group-like', members: [{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }] },
    ] as never);
    jest.mocked(prisma.conversation.create).mockResolvedValue(created as never);

    await expect(service.getOrCreateDirectConversation('user-1', 'user-3')).resolves.toBe(created);
    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: {
        type: 'DIRECT',
        members: {
          create: [{ userId: 'user-1' }, { userId: 'user-3' }],
        },
      },
      include: { members: true },
    });
  });
});
