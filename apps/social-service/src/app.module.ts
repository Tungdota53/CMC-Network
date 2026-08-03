import { Module } from '@nestjs/common';
import { CommonModule } from '@campus-connect/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { LiveStreamsModule } from './live-streams/live-streams.module';

@Module({
  imports: [
    CommonModule.register({ enableAuth: false, optionalAuth: true }),
    PostsModule,
    LiveStreamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
