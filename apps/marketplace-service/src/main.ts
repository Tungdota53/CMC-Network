import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'marketplace-service',
    port: 38083,
    staticAssets: { root: join(process.cwd(), 'uploads'), prefix: '/uploads/' },
  });
}
bootstrap();
