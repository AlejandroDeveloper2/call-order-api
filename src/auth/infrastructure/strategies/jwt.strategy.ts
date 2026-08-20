import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy, IAuthModuleOptions } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';

/** Puertos */
import {
  PERMISSION_REPOSITORY,
  PermissionRepositoryPort,
} from '../../../users/domain/ports/permission.repository.port';
import { ACCOUNT_REPOSITORY, AccountRepositoryPort } from '../../domain/ports';

/** Tipos */
import { JwtPayload } from '../../../shared/domain/types';

/** Errores */
import { AppError } from '../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../domain/exceptions/auth-error-codes';
import { SHARED_ERROR_CODES } from '../../../shared/domain/exceptions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  /** Sobreescribimos authenticate para capturar TokenExpiredError antes de que
   * passport lo convierta en un 401 genérico sin código personalizado. */
  authenticate(req: Request, options?: IAuthModuleOptions) {
    super.authenticate(req, {
      ...options,
      failWithError: true,
    });
  }

  handleRequest<TUser = JwtPayload>(
    err: Error | null | false,
    user: TUser,
    info: unknown,
  ): TUser {
    if (info instanceof TokenExpiredError) {
      throw new AppError(
        SHARED_ERROR_CODES.tokenExpired,
        401,
        'El token de sesión ha expirado',
        true,
      );
    }

    if (err || !user) {
      throw (
        (err as Error) ??
        new AppError(
          SHARED_ERROR_CODES.invalidToken,
          401,
          'Token de sesión inválido',
          true,
        )
      );
    }

    return user;
  }

  async validate(payload: JwtPayload) {
    const account = await this.accountRepository.findById(payload.accountId);

    /** Validamos si la cuenta existe */
    if (!account)
      throw new AppError(
        AUTH_ERROR_CODES.invalidSession,
        401,
        'Sesión invalida',
        true,
      );

    /** Validamos si la cuenta está bloqueada */
    if (account.lockedUtil !== undefined && account.lockedUtil !== null) {
      const isLocked = new Date() < new Date(account.lockedUtil);

      if (isLocked)
        throw new AppError(
          AUTH_ERROR_CODES.loginLocked,
          403,
          'Su cuenta ha sido bloqueada hasta ' +
            account.lockedUtil.toLocaleString(),
          true,
        );
    }

    /** Validamos si el perfil está activo */
    if (account.profile && !account.profile.isActive)
      throw new AppError(
        AUTH_ERROR_CODES.inactiveAccount,
        403,
        'Su perfil no está activo',
        true,
      );

    /** Obtenemos los permisos del rol */
    const permissions = await this.permissionRepository.findPermissionsByRoleId(
      payload.roleId,
    );

    return {
      ...payload,
      permissions: permissions.map((permission) => permission.code),
    };
  }
}
