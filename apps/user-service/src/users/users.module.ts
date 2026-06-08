import { Module } from '@nestjs/common';
import { NotificationDispatcher } from '@campus-connect/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService, NotificationDispatcher],
  controllers: [UsersController],
})
export class UsersModule {}
