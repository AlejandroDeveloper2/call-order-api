import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { AppError, SHARED_ERROR_CODES } from '../../domain/exceptions';

export const BearerToken = createParamDecorator(
    (_: unknown, ctx: ExecutionContext): string | null => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const authHeader = request.headers?.authorization;
        if (!authHeader) {
            throw new AppError(
                SHARED_ERROR_CODES.missingToken,
                401,
                'Token no proporcionado',
                true,
            );
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer') {
            throw new AppError(
                SHARED_ERROR_CODES.invalidToken,
                401,
                'Token con formato inválido',
                true,
            );
        }
        return token;
    },
);
