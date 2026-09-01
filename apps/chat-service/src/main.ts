import { bootstrapService } from '@campus-connect/common';
import { AppModule } from './app.module';
import { resolve } from 'path';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Logger } from '@nestjs/common';

/**
 * Custom adapter that uses Redis pub/sub for Socket.IO so multiple chat-service
 * instances can broadcast events to each other. Falls back to default in-memory
 * adapter when Redis is unavailable.
 */
class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger('RedisIoAdapter');
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  async connectToRedis(redisUrl: string): Promise<void> {
    try {
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('✅ Socket.IO Redis adapter connected');
    } catch (err) {
      this.logger.warn(
        `⚠️  Redis adapter unavailable — using in-memory adapter. Error: ${(err as Error).message}`,
      );
    }
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}

async function bootstrap() {
  await bootstrapService(AppModule, {
    serviceName: 'chat-service',
    port: 38080,
    staticAssets: {
      root: resolve(
        process.env.UPLOAD_ROOT ||
          resolve(process.cwd(), '..', '..', '.data', 'uploads'),
      ),
      prefix: '/uploads/',
    },
    beforeListen: async (app) => {
      // Must run before app.listen(), otherwise Nest initializes gateways with
      // the default in-memory adapter and cluster workers cannot fanout calls.
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const ioAdapter = new RedisIoAdapter(app);
      await ioAdapter.connectToRedis(redisUrl);
      app.useWebSocketAdapter(ioAdapter);
    },
  });
}
void bootstrap();
