import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxyService } from './proxy/proxy.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const proxyServiceMock = {
      getHealthStatus: jest.fn().mockReturnValue([
        { name: 'Auth Service', prefix: 'auth', url: 'http://localhost:3002' },
      ]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: ProxyService, useValue: proxyServiceMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('GET /health', () => {
    it('returns ok + gateway name + per-service routing table', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.gateway).toBe('api-gateway');
      expect(typeof result.timestamp).toBe('string');
      expect(Array.isArray(result.services)).toBe(true);
      expect(result.services[0]).toMatchObject({ prefix: 'auth' });
    });
  });
});
