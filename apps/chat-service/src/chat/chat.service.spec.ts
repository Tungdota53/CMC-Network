import { ChatService } from './chat.service';
import { prisma } from '@campus-connect/database';

jest.mock('@campus-connect/database', () => {
  const mockPrisma = {
    $transaction: jest
      .fn()
      .mockImplementation((args) =>
        Array.isArray(args) ? Promise.all(args) : args(mockPrisma),
      ),
    conversation: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      upsert: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    messageReaction: {
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    messageReadReceipt: {
      createMany: jest.fn(),
    },
    conversationUserState: {
      upsert: jest.fn(),
    },
    conversationMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

describe('ChatService — direct conversations', () => {
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
    jest
      .mocked(prisma.conversation.findMany)
      .mockResolvedValue([conversation] as never);

    await expect(
      service.getOrCreateDirectConversation('user-1', 'user-2'),
    ).resolves.toBe(conversation);
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('creates a direct conversation when no two-member match exists', async () => {
    const created = {
      id: 'conversation-2',
      members: [{ userId: 'user-1' }, { userId: 'user-3' }],
    };
    jest.mocked(prisma.conversation.findMany).mockResolvedValue([
      {
        id: 'group-like',
        members: [
          { userId: 'user-1' },
          { userId: 'user-2' },
          { userId: 'user-3' },
        ],
      },
    ] as never);
    jest.mocked(prisma.conversation.create).mockResolvedValue(created as never);

    await expect(
      service.getOrCreateDirectConversation('user-1', 'user-3'),
    ).resolves.toBe(created);
  });
});

describe('ChatService — message safety', () => {
  let service: ChatService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService();
  });

  it('rejects sending a message when sender is not a conversation member', async () => {
    jest.mocked(prisma.conversationMember.findUnique).mockResolvedValue(null);
    await expect(
      service.saveMessage('conv-1', 'outsider', 'hi'),
    ).rejects.toThrow(/không thuộc đoạn chat/i);
  });

  it('coerces unknown message types back to text', async () => {
    jest
      .mocked(prisma.conversationMember.findUnique)
      .mockResolvedValue({ id: 'm' } as never);
    jest
      .mocked(prisma.message.create)
      .mockResolvedValue({ id: 'm-1', messageType: 'text' } as never);
    jest.mocked(prisma.conversation.update).mockResolvedValue({} as never);

    await service.saveMessage('conv-1', 'user-1', 'hi', 'malicious-type');

    const call = jest.mocked(prisma.message.create).mock.calls[0][0] as {
      data: { messageType: string };
    };
    expect(call.data.messageType).toBe('text');
  });

  it('rejects a reply target from another conversation', async () => {
    jest
      .mocked(prisma.conversationMember.findUnique)
      .mockResolvedValue({ id: 'membership-1' } as never);
    jest.mocked(prisma.message.findFirst).mockResolvedValue(null);

    await expect(
      service.saveMessage(
        'conv-1',
        'user-1',
        'reply',
        'text',
        undefined,
        'message-from-conv-2',
      ),
    ).rejects.toThrow(/tin nhắn trả lời không thuộc đoạn chat/i);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('allows a reply target from the same conversation', async () => {
    jest
      .mocked(prisma.conversationMember.findUnique)
      .mockResolvedValue({ id: 'membership-1' } as never);
    jest
      .mocked(prisma.message.findFirst)
      .mockResolvedValue({ id: 'message-1' } as never);
    jest
      .mocked(prisma.message.create)
      .mockResolvedValue({ id: 'message-2' } as never);
    jest.mocked(prisma.conversation.update).mockResolvedValue({} as never);

    await expect(
      service.saveMessage(
        'conv-1',
        'user-1',
        'reply',
        'text',
        undefined,
        'message-1',
      ),
    ).resolves.toEqual({ id: 'message-2' });
  });

  it('uses client message id as an idempotency key', async () => {
    jest
      .mocked(prisma.conversationMember.findUnique)
      .mockResolvedValue({ id: 'membership-1' } as never);
    jest
      .mocked(prisma.message.upsert)
      .mockResolvedValue({ id: 'message-1', content: 'hello' } as never);
    jest.mocked(prisma.conversation.update).mockResolvedValue({} as never);

    await service.saveMessage(
      'conv-1',
      'user-1',
      'hello',
      'text',
      undefined,
      undefined,
      'temp-1',
    );

    expect(prisma.message.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          conversationId_senderId_clientMessageId: {
            conversationId: 'conv-1',
            senderId: 'user-1',
            clientMessageId: 'temp-1',
          },
        },
        update: {},
        create: expect.objectContaining({ clientMessageId: 'temp-1' }),
      }),
    );
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('rejects empty and oversized message content', async () => {
    await expect(
      service.saveMessage('conv-1', 'user-1', '   '),
    ).rejects.toThrow(/nội dung/i);
    await expect(
      service.saveMessage('conv-1', 'user-1', 'x'.repeat(4001)),
    ).rejects.toThrow(/4000/i);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('rejects empty edits and unsupported reactions', async () => {
    await expect(
      service.editMessage('message-1', 'user-1', '   '),
    ).rejects.toThrow(/nội dung/i);
    await expect(
      service.addReaction('message-1', 'user-1', 'CUSTOM_SCRIPT'),
    ).rejects.toThrow(/cảm xúc/i);
    expect(prisma.message.findUnique).not.toHaveBeenCalled();
    expect(prisma.messageReaction.upsert).not.toHaveBeenCalled();
  });
});

describe('ChatService — unread counts', () => {
  let service: ChatService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService();
  });

  it("aggregates unread counts per conversation, excluding the viewer's own messages", async () => {
    jest
      .mocked(prisma.conversationMember.findMany)
      .mockResolvedValue([
        { conversationId: 'c1' },
        { conversationId: 'c2' },
      ] as never);
    jest.mocked(prisma.message.groupBy).mockResolvedValue([
      { conversationId: 'c1', _count: { _all: 3 } },
      { conversationId: 'c2', _count: { _all: 1 } },
    ] as never);

    const result = await service.getUnreadCounts('viewer');
    expect(result.total).toBe(4);
    expect(result.perConversation).toHaveLength(2);
    expect(prisma.message.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          readReceipts: { none: { userId: 'viewer' } },
        }),
      }),
    );
  });

  it('marks only unread message ids for the current viewer without changing global status', async () => {
    jest
      .mocked(prisma.conversationMember.findUnique)
      .mockResolvedValue({ id: 'membership-1' } as never);
    jest
      .mocked(prisma.message.findMany)
      .mockResolvedValue([{ id: 'message-1' }, { id: 'message-2' }] as never);
    jest
      .mocked(prisma.messageReadReceipt.createMany)
      .mockResolvedValue({ count: 2 });
    jest
      .mocked(prisma.conversationUserState.upsert)
      .mockResolvedValue({} as never);

    await expect(
      service.markConversationRead('conv-1', 'viewer'),
    ).resolves.toEqual({
      updated: 2,
      messageIds: ['message-1', 'message-2'],
    });
    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          readReceipts: { none: { userId: 'viewer' } },
        }),
      }),
    );
    expect(prisma.message.updateMany).not.toHaveBeenCalled();
  });

  it('returns zero when the viewer has no conversations', async () => {
    jest
      .mocked(prisma.conversationMember.findMany)
      .mockResolvedValue([] as never);
    const result = await service.getUnreadCounts('viewer');
    expect(result.total).toBe(0);
    expect(result.perConversation).toEqual([]);
    expect(prisma.message.groupBy).not.toHaveBeenCalled();
  });
});
