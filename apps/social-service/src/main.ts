import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';
import { resolve } from 'path';

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'social-service',
    port: 38888,
    staticAssets: {
      root: resolve(
        process.env.UPLOAD_ROOT ||
          resolve(process.cwd(), '..', '..', '.data', 'uploads'),
      ),
      prefix: '/uploads/',
    },
  });
}
void bootstrap();
