import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';
import { resolve } from 'path';

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'material-service',
    port: 38082,
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
