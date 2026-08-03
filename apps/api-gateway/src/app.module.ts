import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxyModule } from './proxy/proxy.module';
import { CommonModule } from '@campus-connect/common';

@Module({
  imports: [
    CommonModule.register({ enableAuth: false }),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ProxyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
