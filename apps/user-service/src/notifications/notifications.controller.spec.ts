import { ForbiddenException } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController — legacy user routes', () => {
  const notificationsService = {
    list: jest.fn(),
    unreadCount: jest.fn(),
    markAllRead: jest.fn(),
    markRead: jest.fn(),
  };
  const controller = new NotificationsController(notificationsService as never);

  beforeEach(() => jest.clearAllMocks());

  it('allows a legacy route when path userId matches JWT subject', async () => {
    notificationsService.list.mockResolvedValue([]);

    await controller.list('user-1', 'user-1');

    expect(notificationsService.list).toHaveBeenCalledWith('user-1', 30);
  });

  it('rejects a legacy route when path userId differs from JWT subject', async () => {
    await expect(controller.list('user-1', 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(notificationsService.list).not.toHaveBeenCalled();
  });

  it('rejects cross-user notification mutations', async () => {
    await expect(
      controller.markRead('user-1', 'notification-1', 'user-2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(notificationsService.markRead).not.toHaveBeenCalled();
  });
});
