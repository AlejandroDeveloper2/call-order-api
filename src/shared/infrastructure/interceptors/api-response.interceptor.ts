import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Response } from 'express';
import { Reflector } from '@nestjs/core';

import { ApiResponse } from '../../domain/types';

import { API_MESSAGE_KEY } from '../decorators';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const httpCode = response.statusCode;

    const message =
      this.reflector.get<string>(API_MESSAGE_KEY, context.getHandler()) ||
      'Success';

    return next.handle().pipe(
      map((data: unknown) => ({
        data,
        message,
        httpCode,
      })),
    );
  }
}
