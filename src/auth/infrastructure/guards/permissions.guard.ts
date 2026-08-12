import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/** Errores de dominio */
import {
  AppError,
  SHARED_ERROR_CODES,
} from '../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../domain/exceptions/auth-error-codes';

/** Keys */
import { PERMISSIONS_KEY } from '../decorators';

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
    const account = request.account;

    if (!account)
      throw new AppError(
        SHARED_ERROR_CODES.notAuthenticated,
        401,
        'Usuario no autenticado',
        true,
      );

    const userPermissions: string[] = account.permissions || [];

    const hasAll = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAll)
      throw new AppError(
        AUTH_ERROR_CODES.insufficientPermissions,
        403,
        'Permisos insuficientes para acceder a este recurso',
        true,
      );

    return true;
  }
}
