import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomException } from '../exceptions/custom.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // ── CustomException → { status: "failed", code: "3002", data: { message } }
    if (exception instanceof CustomException) {
      const body = exception.getResponse() as { code: string; message: string };
      return response.status(exception.getStatus()).json({
        status: 'failed',
        code: body.code,
        data: { message: body.message },
      });
    }

    // ── NestJS built-in HttpException (guards, pipes, @nestjs/* decorators)
    //    → { status: "error", code: <httpStatus>, message }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : (body as any).message ?? exception.message;

      return response.status(status).json({
        status: 'error',
        code: status,
        message,
      });
    }

    // ── Unknown / unhandled errors → 500
    if (exception instanceof Error) {
      this.logger.error(`${request.method} ${request.url}`, exception.stack);
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
