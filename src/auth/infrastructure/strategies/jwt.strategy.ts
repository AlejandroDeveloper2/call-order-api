import { Injectable } from '@nestjs/common';
import { PassportStrategy, IAuthModuleOptions } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';

/** Tipos */
import { AccessTokenPayload } from '../../domain/types';

/** Errores */
import { ExpiredTokenException, MalformedTokenException } from '../exceptions';

/** Caso de uso */
import { ValidateAccessTokenUseCase } from '../../application/use-cases';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly validateAccessTokenUseCase: ValidateAccessTokenUseCase,
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

  handleRequest<TUser = AccessTokenPayload>(
    err: Error | null | false,
    user: TUser,
    info: unknown,
  ): TUser {
    if (info instanceof TokenExpiredError) {
      throw new ExpiredTokenException('El token de sesión ha expirado');
    }

    if (err || !user) {
      throw (
        (err as Error) ??
        new MalformedTokenException(
          'Token de sesión malformdo o no proporcionado',
        )
      );
    }

    return user;
  }

  async validate(payload: AccessTokenPayload) {
    return await this.validateAccessTokenUseCase.run(payload);
  }
}
