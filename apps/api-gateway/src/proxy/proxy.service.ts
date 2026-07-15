import {
  Injectable,
  Logger,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import 'multer';

export interface ServiceRoute {
  prefix: string;
  url: string;
  name: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  /** Upstream request timeout (ms) so a hung service can't stall the gateway. */
  private readonly timeoutMs = Number(process.env.GATEWAY_TIMEOUT_MS) || 15_000;
  private readonly maxBodyLength =
    Number(process.env.GATEWAY_MAX_BODY_LENGTH_BYTES) || 25 * 1024 * 1024;
  private readonly maxContentLength =
    Number(process.env.GATEWAY_MAX_CONTENT_LENGTH_BYTES) || 25 * 1024 * 1024;

  private readonly routes: ServiceRoute[] = [
    {
      prefix: 'auth',
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
      name: 'Auth Service',
    },
    {
      prefix: 'users',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service',
    },
    {
      prefix: 'mentors',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Mentors)',
    },
    {
      prefix: 'reputation',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Reputation)',
    },
    {
      prefix: 'grades',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Grades)',
    },
    {
      prefix: 'timetable',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Timetable)',
    },
    {
      prefix: 'professors',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Professors)',
    },
    {
      prefix: 'clubs',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Clubs)',
    },
    {
      prefix: 'notifications',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Notifications)',
    },
    {
      prefix: 'admin',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Admin)',
    },
    {
      prefix: 'reports',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Reports)',
    },
    {
      prefix: 'search',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      name: 'User Service (Search)',
    },
    {
      prefix: 'posts',
      url: process.env.SOCIAL_SERVICE_URL || 'http://localhost:3004',
      name: 'Social Service',
    },
    {
      prefix: 'chat',
      url: process.env.CHAT_SERVICE_URL || 'http://localhost:3005',
      name: 'Chat Service',
    },
    {
      prefix: 'study-groups',
      url: process.env.STUDY_SERVICE_URL || 'http://localhost:3006',
      name: 'Study Service',
    },
    {
      prefix: 'events',
      url: process.env.STUDY_SERVICE_URL || 'http://localhost:3006',
      name: 'Study Service (Events)',
    },
    {
      prefix: 'materials',
      url: process.env.MATERIAL_SERVICE_URL || 'http://localhost:3007',
      name: 'Material Service',
    },
    {
      prefix: 'marketplace',
      url: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3008',
      name: 'Marketplace Service',
    },
    {
      prefix: 'ai',
      url: process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1',
      name: 'AI Service',
    },
  ];

  constructor(private readonly httpService: HttpService) {}

  findRoute(path: string): ServiceRoute | null {
    // `path` already has the leading slash stripped by the controller
    // (e.g. "users/123" or "search?q=foo"), so the prefix is the FIRST
    // segment — split off any query string before matching.
    const segment = path.split('?')[0].split('/')[0];
    return this.routes.find((r) => r.prefix === segment) || null;
  }

  async forwardRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    body?: any,
    headers?: Record<string, string>,
    files?: Express.Multer.File[],
  ) {
    const route = this.findRoute(path);

    if (!route) {
      throw new NotFoundException(`Service not found for path: /${path}`);
    }

    const targetUrl = `${route.url}/${path}`;
    const authHeader = headers?.['authorization'];

    const requestHeaders: Record<string, string> = {};
    let requestBody = body;

    // Support multipart/form-data (e.g. for file uploads), otherwise default to json
    const contentType = headers?.['content-type'];
    if (
      contentType &&
      contentType.toLowerCase().includes('multipart/form-data')
    ) {
      const form = new FormData();

      const formFields: Record<string, unknown> =
        body && typeof body === 'object'
          ? (body as Record<string, unknown>)
          : {};

      for (const [key, value] of Object.entries(formFields)) {
        if (Array.isArray(value)) {
          for (const item of value)
            form.append(key, this.stringifyFormValue(item));
        } else if (value !== undefined && value !== null) {
          form.append(key, this.stringifyFormValue(value));
        }
      }

      for (const file of files || []) {
        form.append(file.fieldname, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
          knownLength: file.size,
        });
      }

      requestBody = form;
      Object.assign(requestHeaders, form.getHeaders());
    } else {
      requestHeaders['Content-Type'] = 'application/json';
    }

    if (authHeader) {
      requestHeaders['Authorization'] = authHeader;
    }

    this.logger.log(`Proxying ${method} ${targetUrl} -> ${route.name}`);

    const response$ = this.httpService
      .request({
        method,
        url: targetUrl,
        data: requestBody,
        headers: requestHeaders,
        maxBodyLength: this.maxBodyLength,
        maxContentLength: this.maxContentLength,
        timeout: this.timeoutMs,
      })
      .pipe(
        catchError((error: AxiosError) => {
          const status = error.response?.status;
          this.logger.error(
            `Proxy error for ${method} ${targetUrl}: ${status ?? error.code} - ${error.message}`,
          );

          // Propagate the downstream service's real status + body so that
          // 400/401/403/404/409 etc. reach the client unchanged instead of
          // being masked as 500. Only connectivity/timeout failures (no
          // response) become 503.
          if (error.response) {
            throw new HttpException(
              error.response.data || { message: 'Service returned an error' },
              status ?? 500,
            );
          }

          throw new ServiceUnavailableException(
            `${route.name} is unavailable. Please try again later.`,
          );
        }),
      );

    return firstValueFrom(response$);
  }

  async forwardStreamRequest(
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
    const requestHeaders: Record<string, string> = {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    };
    if (headers?.authorization)
      requestHeaders.Authorization = headers.authorization;

    this.logger.log(`Streaming ${method} ${targetUrl} -> ${route.name}`);

    const response$ = this.httpService.request({
      method,
      url: targetUrl,
      data: body,
      headers: requestHeaders,
      responseType: 'stream',
      timeout: 60_000,
    });

    return firstValueFrom(response$);
  }

  getHealthStatus() {
    return this.routes.map((route) => ({
      name: route.name,
      prefix: route.prefix,
      url: route.url,
    }));
  }

  private stringifyFormValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value);
  }
}
