import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'material-service',
    port: 3007,
  });
}
bootstrap();
