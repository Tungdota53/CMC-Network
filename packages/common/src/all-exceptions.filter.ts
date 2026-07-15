import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/**
 * Catches everything and returns a consistent JSON shape. Internal errors are
 * logged with stack traces but never leak details to the client in production.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    let error = 'Internal Server Error';
    let resolvedStatus: number = status;

    // Prisma known-request errors: map to sensible HTTP codes thay vì 500.
    const prismaCode = (exception as { code?: string })?.code;
    const isPrismaKnownError =
      typeof prismaCode === 'string' &&
      /^P\d{4}$/.test(prismaCode) &&
      (exception as { name?: string })?.name === 'PrismaClientKnownRequestError';
    const isPrismaValidationError =
      (exception as { name?: string })?.name === 'PrismaClientValidationError';

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object') {
        const r = response as Record<string, unknown>;
        message = (r.message as string | string[]) ?? message;
        error = (r.error as string) ?? exception.name;
      }
    } else if (isPrismaKnownError) {
      switch (prismaCode) {
        case 'P2025': // Không tìm thấy bản ghi
          resolvedStatus = HttpStatus.NOT_FOUND;
          error = 'Not Found';
          message = 'Không tìm thấy dữ liệu yêu cầu.';
          break;
        case 'P2002': // Vi phạm ràng buộc duy nhất
          resolvedStatus = HttpStatus.CONFLICT;
          error = 'Conflict';
          message = 'Dữ liệu đã tồn tại.';
          break;
        case 'P2003': // Vi phạm khóa ngoại
        case 'P2023': // ID/UUID không hợp lệ
          resolvedStatus = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          message = 'Tham số không hợp lệ.';
          break;
        default:
          resolvedStatus = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          message = 'Yêu cầu không hợp lệ.';
      }
    } else if (isPrismaValidationError) {
      resolvedStatus = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = 'Tham số không hợp lệ.';
    } else if (exception instanceof Error) {
      error = exception.name;
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    if (resolvedStatus >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${req.method} ${req.url} -> ${resolvedStatus}: ${
          exception instanceof Error ? exception.stack : String(exception)
        }`,
      );
    } else {
      this.logger.warn(`${req.method} ${req.url} -> ${resolvedStatus}: ${JSON.stringify(message)}`);
    }

    const body: ErrorBody = {
      statusCode: resolvedStatus,
      message,
      error,
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    res.status(resolvedStatus).json(body);
  }
}
