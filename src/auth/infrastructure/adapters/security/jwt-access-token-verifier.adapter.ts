import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AccessTokenVerifierPort } from '../../domain/ports';

import { AccessTokenPayload } from '../../domain/types';

@Injectable()
export class JwtAccessTokenVerifierAdapter implements AccessTokenVerifierPort {
  constructor(private readonly jwtService: JwtService) {}

  async verify(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync(token, { ignoreExpiration: true });
  }
}
