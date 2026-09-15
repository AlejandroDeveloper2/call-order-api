import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { MalformedTokenException, MissingTokenException } from '../exceptions';

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
}
