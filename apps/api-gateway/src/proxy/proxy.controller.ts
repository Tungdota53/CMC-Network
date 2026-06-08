import {
  Controller,
  All,
  Req,
  Res,
  Logger,
  HttpException,
} from '@nestjs/common';
import * as express from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  async handleProxy(@Req() req: express.Request, @Res() res: express.Response) {
    try {
      const { method, body, headers } = req;
      const authHeader = headers['authorization'] as string | undefined;

      // `req.originalUrl` preserves the query string (e.g. "/search?q=foo"),
      // unlike `req.path` which only returns "/search". Strip the leading
      // slash so downstream URL composition stays the same.
      const pathWithQuery = (req.originalUrl || req.url || '').replace(/^\//, '');

      const result = await this.proxyService.forwardRequest(
        method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        pathWithQuery,
        body,
        authHeader ? { authorization: authHeader } : undefined,
      );

      res.status(result.status).json(result.data);
    } catch (error) {
      this.logger.error(`Gateway error: ${error?.message}`);

      // ProxyService now throws Nest HttpExceptions carrying the downstream
      // service's real status + body — surface them unchanged so 4xx stays 4xx.
      if (error instanceof HttpException) {
        const payload = error.getResponse();
        res
          .status(error.getStatus())
          .json(typeof payload === 'string' ? { message: payload } : payload);
        return;
      }

      // Unknown failure — treat as Bad Gateway.
      res.status(502).json({
        statusCode: 502,
        message: 'Bad Gateway: Unable to reach service',
        error: error?.message,
      });
    }
  }
}
