import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MicrosoftStrategy } from './microsoft.strategy';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, MicrosoftStrategy],
})
export class AppModule {}
