import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** Exceptions */
import { AppError } from '../../domain/exceptions';

/** Utils */
import { handleHttpError } from '../utils/handleHttpError';

/** Error Codes */
import { SHARED_ERROR_CODES } from '../../domain/exceptions';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof AppError) {
      return handleHttpError(response, {
        name: exception.name,
        httpCode: exception.httpCode,
        isOperational: exception.isOperational,
        description: exception.message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      return handleHttpError(response, {
        name: exception.name,
        httpCode: status,
        isOperational: true,
        description: exception.message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    return handleHttpError(response, {
      name: SHARED_ERROR_CODES.internalServerError,
      httpCode: 500,
      isOperational: false,
      description: 'Unexpected error occurred',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
