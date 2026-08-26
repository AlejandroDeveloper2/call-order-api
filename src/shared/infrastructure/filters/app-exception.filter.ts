import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

// Excepciones de dominio
import { DomainException } from '../../domain/exceptions';

// Excepciones de aplicación
import { ApplicationException } from '../../application/exceptions';

// Excepciones de infraestructura
import { InfrastructureException } from '../exceptions/infrastructure.exception';

/** Mapper para códigos de estado HTTP */
import { EXCEPTION_HTTP_STATUS } from '../exceptions/exception-http-status.mapper';

//Utilidad para manejar la respuesta HTTP de error al cliente
import { handleHttpError } from '../utils/handleHttpError';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    const request = ctx.getRequest<Request>();

    if (
      exception instanceof DomainException ||
      exception instanceof ApplicationException ||
      exception instanceof InfrastructureException
    ) {
      const httpCode =
        EXCEPTION_HTTP_STATUS[exception.code] ??
        HttpStatus.INTERNAL_SERVER_ERROR;

      return handleHttpError(response, {
        name: exception.code,
        httpCode,
        isOperational: true,
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
      name: 'INTERNAL_SERVER_ERROR',
      httpCode: HttpStatus.INTERNAL_SERVER_ERROR,
      isOperational: false,
      description: 'Ha ocurrido un error inesperado',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
