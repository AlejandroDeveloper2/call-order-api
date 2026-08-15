import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { AppError, SHARED_ERROR_CODES } from '../../domain/exceptions';

export const Cookie = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const cookie = request.cookies?.[key] as string;

    if (!cookie) {
      throw new AppError(
        SHARED_ERROR_CODES.refreshNotProvided,
        401,
        'Refresh token no proporcionado',
        true,
      );
    }
    return cookie;
  },
);
