import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

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
      const isLocked = new Date() < account.lockedUtil;

      if (isLocked)
        throw new AppError(
          AUTH_ERROR_CODES.loginLocked,
          403,
          'Su cuenta ha sido bloqueada hasta ' + account.lockedUtil.toLocaleString(),
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
