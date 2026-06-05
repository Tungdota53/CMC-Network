import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

export interface ServiceRoute {
  prefix: string;
  url: string;
  name: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  private readonly routes: ServiceRoute[] = [
    { prefix: 'auth', url: process.env.AUTH_SERVICE_URL || 'http://localhost:3002', name: 'Auth Service' },
    { prefix: 'users', url: process.env.USER_SERVICE_URL || 'http://localhost:3003', name: 'User Service' },
    { prefix: 'posts', url: process.env.SOCIAL_SERVICE_URL || 'http://localhost:3004', name: 'Social Service' },
    { prefix: 'chat', url: process.env.CHAT_SERVICE_URL || 'http://localhost:3005', name: 'Chat Service' },
    { prefix: 'study', url: process.env.STUDY_SERVICE_URL || 'http://localhost:3006', name: 'Study Service' },
    { prefix: 'materials', url: process.env.MATERIAL_SERVICE_URL || 'http://localhost:3007', name: 'Material Service' },
    { prefix: 'marketplace', url: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3008', name: 'Marketplace Service' },
  ];

  constructor(private readonly httpService: HttpService) {}

  findRoute(path: string): ServiceRoute | null {
    const segment = path.split('/')[1];
    return this.routes.find(r => r.prefix === segment) || null;
  }

  async forwardRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ) {
    const route = this.findRoute(path);

    if (!route) {
      throw new NotFoundException(`Service not found for path: /${path}`);
    }

    const targetUrl = `${route.url}/${path}`;
    const authHeader = headers?.['authorization'];

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      requestHeaders['Authorization'] = authHeader;
    }

    this.logger.log(`Proxying ${method} ${targetUrl} -> ${route.name}`);

    const response$ = this.httpService.request({
      method,
      url: targetUrl,
      data: body,
      headers: requestHeaders,
    }).pipe(
      catchError((error: AxiosError) => {
        this.logger.error(
          `Proxy error for ${method} ${targetUrl}: ${error.response?.status} - ${error.message}`,
        );

        if (error.response) {
          throw new InternalServerErrorException(
            error.response.data || 'Service returned an error',
          );
        }

        throw new InternalServerErrorException(
          `${route.name} is unavailable. Please try again later.`,
        );
      }),
    );

    return firstValueFrom(response$);
  }

  getHealthStatus() {
    return this.routes.map(route => ({
      name: route.name,
      prefix: route.prefix,
      url: route.url,
    }));
  }
}
