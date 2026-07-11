import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'social-service',
    port: 38888,
    staticAssets: {
      root: join(process.cwd(), 'uploads'),
      prefix: '/uploads/',
    },
  });
}
bootstrap();
