import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';
import { resolve } from 'path';

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'user-service',
    port: 23306,
    staticAssets: {
      root: resolve(
        process.env.UPLOAD_ROOT ||
          resolve(process.cwd(), '..', '..', '.data', 'uploads'),
      ),
      prefix: '/',
    },
  });
}
void bootstrap();
