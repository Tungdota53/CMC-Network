import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'study-service',
    port: 3006,
  });
}
bootstrap();
