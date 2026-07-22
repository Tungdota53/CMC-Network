import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationEmailService } from './notification-email.service';

@Module({
  providers: [NotificationsService, NotificationEmailService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
