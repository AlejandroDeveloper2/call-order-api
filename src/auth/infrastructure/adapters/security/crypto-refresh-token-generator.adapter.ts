import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

import { RefreshTokenGeneratorPort } from '../../../domain/ports';

@Injectable()
export class CryptoRefreshTokenGeneratorAdapter implements RefreshTokenGeneratorPort {
  generate(): string {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    return refreshToken;
  }
}
