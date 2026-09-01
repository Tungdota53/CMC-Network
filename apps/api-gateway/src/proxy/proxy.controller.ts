import {
  Controller,
  All,
  Req,
  Res,
  Logger,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import * as express from 'express';
import 'multer';
import { ProxyService } from './proxy.service';

const MAX_UPLOAD_FILE_SIZE_BYTES =
  Number(process.env.GATEWAY_MAX_UPLOAD_FILE_SIZE_BYTES) || 20 * 1024 * 1024;
const MAX_UPLOAD_FILES = Number(process.env.GATEWAY_MAX_UPLOAD_FILES) || 10;
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: {
        fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
        files: MAX_UPLOAD_FILES,
      },
    }),
  )
  async handleProxy(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    try {
      const { method, body, headers } = req;
      const authHeader =
        headers['authorization'] ||
        this.authorizationFromCookie(headers.cookie);
      const contentType = headers['content-type'];

      this.validateBrowserOrigin(method, headers);

      // `req.originalUrl` preserves the query string (e.g. "/search?q=foo"),
      // unlike `req.path` which only returns "/search". Strip the leading
      // slash so downstream URL composition stays the same.
      const pathWithQuery = (req.originalUrl || req.url || '').replace(
        /^\//,
        '',
      );

      this.validateUploads(files);

      if (
        pathWithQuery.startsWith('ai/') &&
        pathWithQuery.includes('/stream')
      ) {
        const streamResult = await this.proxyService.forwardStreamRequest(
          method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
          pathWithQuery,
          body,
          authHeader ? { authorization: authHeader } : {},
        );

        res.status(streamResult.status);
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        streamResult.data.pipe(res);
        return;
      }

      const result = await this.proxyService.forwardRequest(
        method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        pathWithQuery,
        body,
        {
          ...(authHeader ? { authorization: authHeader } : {}),
          ...(contentType ? { 'content-type': contentType } : {}),
        },
        files,
      );

      const setCookie = result.headers['set-cookie'];
      if (setCookie) res.setHeader('Set-Cookie', setCookie);
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

  private validateUploads(files?: Express.Multer.File[]) {
    if (!files?.length) return;
    if (files.length > MAX_UPLOAD_FILES) {
      throw new BadRequestException(
        `Tối đa ${MAX_UPLOAD_FILES} file mỗi lần upload.`,
      );
    }

    for (const file of files) {
      if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
        throw new BadRequestException(
          'File vượt quá giới hạn dung lượng gateway.',
        );
      }
      if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
        throw new BadRequestException(
          `Định dạng file không được hỗ trợ: ${file.mimetype}`,
        );
      }
    }
  }

  private authorizationFromCookie(cookieHeader?: string): string | undefined {
    const accessCookie = cookieHeader
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('access_token='));
    if (!accessCookie) return undefined;
    return `Bearer ${decodeURIComponent(accessCookie.slice('access_token='.length))}`;
  }

  private validateBrowserOrigin(
    method: string,
    headers: express.Request['headers'],
  ) {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()))
      return;
    const origin = headers.origin;
    if (!origin) return;

    const allowed = new Set(
      (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
    const forwardedHost = headers['x-forwarded-host'];
    const host = Array.isArray(forwardedHost)
      ? forwardedHost[0]
      : forwardedHost || headers.host;
    if (host) {
      allowed.add(`http://${host}`);
      allowed.add(`https://${host}`);
    }

    if (!allowed.has(origin)) {
      throw new BadRequestException('Nguồn yêu cầu không hợp lệ.');
    }
  }
}
