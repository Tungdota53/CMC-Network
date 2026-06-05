import {
  Controller,
  All,
  Req,
  Res,
  Logger,
  InternalServerErrorException,
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
      const { method, path, body, headers } = req;
      const authHeader = headers['authorization'] as string | undefined;

      const result = await this.proxyService.forwardRequest(
        method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        path.substring(1), // remove leading slash
        body,
        authHeader ? { authorization: authHeader } : undefined,
      );

      res.status(result.status).json(result.data);
    } catch (error) {
      this.logger.error(`Gateway error: ${error.message}`);

      if (error.status) {
        res.status(error.status).json(error.response?.data || { message: error.message });
      } else {
        res.status(502).json({
          statusCode: 502,
          message: 'Bad Gateway: Unable to reach service',
          error: error.message,
        });
      }
    }
  }
}
