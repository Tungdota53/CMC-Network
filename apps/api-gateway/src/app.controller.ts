import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ProxyService } from './proxy/proxy.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly proxyService: ProxyService,
  ) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      gateway: 'api-gateway',
      timestamp: new Date().toISOString(),
      services: this.proxyService.getHealthStatus(),
    };
  }
}
