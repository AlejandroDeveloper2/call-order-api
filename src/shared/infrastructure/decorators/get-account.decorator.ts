import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { JwtPayload } from '../../domain/types';
import { AppError, SHARED_ERROR_CODES } from '../../domain/exceptions';

export const GetAccount = createParamDecorator(
  (data: keyof JwtPayload, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const account = req.account;

    if (!account)
      throw new AppError(
        SHARED_ERROR_CODES.jwtPayloadNotProvided,
        400,
        'JWT payload not provided',
        true,
      );
    if (!data) return account;
    return account[data];
  },
);
