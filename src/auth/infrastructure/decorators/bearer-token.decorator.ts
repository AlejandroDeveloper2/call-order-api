import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { MalformedTokenException, MissingTokenException } from '../exceptions';

export const BearerToken = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const authHeader = request.headers?.authorization;
    if (!authHeader) throw new MissingTokenException('Token no proporcionado');

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
      throw new MalformedTokenException('Token con formato inválido');
    }
    return token;
  },
);
