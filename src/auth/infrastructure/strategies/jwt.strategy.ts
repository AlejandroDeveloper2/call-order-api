import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/** Tipos */
import { AccessTokenPayload } from '../../domain/types';

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

  async validate(payload: AccessTokenPayload) {
    return await this.validateAccessTokenUseCase.run(payload);
  }
}
