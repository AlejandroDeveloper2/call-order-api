import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/** Keys */
import { PERMISSIONS_KEY } from '../decorators';

/** Excepciones */
import {
  InsufficientPermissionsException,
  NotAuthenticatedException,
} from '../exceptions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los permisos requeridos desde el decorador @Permissions()
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) throw new NotAuthenticatedException('Usuario no autenticado');

    const userPermissions: string[] = user.permissions || [];

    const hasAll = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAll)
      throw new InsufficientPermissionsException(
        'Permisos insuficientes para acceder a este recurso',
      );

    return true;
  }
}
