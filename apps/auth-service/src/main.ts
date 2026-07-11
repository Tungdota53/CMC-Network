import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'auth-service',
    port: 22022,
  });
}
bootstrap();
