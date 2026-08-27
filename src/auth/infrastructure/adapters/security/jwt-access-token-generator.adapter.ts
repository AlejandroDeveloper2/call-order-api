import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** Puertos */
import { AccessTokenGeneratorPort } from '../../../domain/ports';

/** Tipos */
import { AccessTokenPayload } from '../../../domain/types';

@Injectable()
export class JwtAccessTokenGeneratorAdapter implements AccessTokenGeneratorPort {
  constructor(private readonly jwtService: JwtService) {}

  async generate(payload: AccessTokenPayload): Promise<string> {
    const token = await this.jwtService.signAsync(payload);
    return token;
  }
}
