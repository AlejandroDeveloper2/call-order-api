/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/** Puertos */
import {
  PERMISSION_REPOSITORY,
  PermissionRepositoryPort,
} from '../../../users/domain/ports/permission.repository.port';
/** Tipos */
import { JwtPayload } from '../../../shared/domain/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepositoryPort,
    configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
      ignoreExpiration: true,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload) {
    const permissions = await this.permissionRepository.findPermissionsByRoleId(
      payload.roleId,
    );

    return {
      ...payload,
      permissions: permissions.map((permission) => permission.code),
    };
  }
}
