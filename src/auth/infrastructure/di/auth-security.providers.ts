import { Provider } from '@nestjs/common';

import {
  EncryptorPort,
  AccessTokenGeneratorPort,
  RefreshTokenGeneratorPort,
  AccessTokenVerifierPort,
} from '../../domain/ports';

import {
  BcryptAdapter,
  JwtAccessTokenGeneratorAdapter,
  JwtAccessTokenVerifierAdapter,
  CryptoRefreshTokenGeneratorAdapter,
} from '../security';

export const AUTH_SECURITY_PROVIDERS: Provider[] = [
  {
    provide: EncryptorPort,
    useClass: BcryptAdapter,
  },

  {
    provide: AccessTokenGeneratorPort,
    useClass: JwtAccessTokenGeneratorAdapter,
  },

  {
    provide: AccessTokenVerifierPort,
    useClass: JwtAccessTokenVerifierAdapter,
  },

  {
    provide: RefreshTokenGeneratorPort,
    useClass: CryptoRefreshTokenGeneratorAdapter,
  },
];
