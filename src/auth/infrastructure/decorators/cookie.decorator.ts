import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { MissingRefreshTokenException } from '../exceptions';

export const Cookie = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const cookie = request.cookies?.[key] as string;

    if (!cookie) {
      throw new MissingRefreshTokenException('Refresh token no proporcionado');
    }
    return cookie;
  },
);
