import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { AccessTokenPayload } from '../../domain/types';

import { NotAuthenticatedException } from '../exceptions';

export const GetAccount = createParamDecorator(
  (data: keyof AccessTokenPayload, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const user = req.user;

    if (!user) throw new NotAuthenticatedException('Usuario no autenticado');
    if (!data) return user;
    return user[data];
  },
);
