import { Module } from '@nestjs/common';
import { NotificationDispatcher } from '@campus-connect/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  providers: [PostsService, NotificationDispatcher],
  controllers: [PostsController],
})
export class PostsModule {}
