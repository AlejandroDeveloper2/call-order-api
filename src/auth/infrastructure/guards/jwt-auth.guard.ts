import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';

import {
  ExpiredTokenException,
  MalformedTokenException,
  MissingTokenException,
} from '../exceptions';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new MissingTokenException('Token no proporcionado');

    const [type] = authHeader.split(' ');
    if (type !== 'Bearer')
      throw new MalformedTokenException('Token con formato inválido');

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.headers.authorization) {
      throw new MissingTokenException('Token no proporcionado');
    }

    if (err) throw err as Error;

    if (info instanceof TokenExpiredError) {
      throw new ExpiredTokenException('El token de sesión ha expirado');
    }

    if (!user) {
      throw new MalformedTokenException('Token de sesión malformado');
    }

    return user;
  }
}
