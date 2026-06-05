import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketplaceModule } from './marketplace/marketplace.module';

@Module({
  imports: [MarketplaceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
