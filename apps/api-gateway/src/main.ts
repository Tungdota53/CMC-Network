import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'api-gateway',
    port: 25021,
  });
}
void bootstrap();
