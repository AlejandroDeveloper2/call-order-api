import { Provider } from '@nestjs/common';

import {
  ENCRYPTOR,
  ACCESS_TOKEN_GENERATOR,
  ACCESS_TOKEN_VERIFIER,
  REFRESH_TOKEN_GENERATOR,
} from '../../domain/ports';

import {
  BcryptAdapter,
  JwtAccessTokenGeneratorAdapter,
  JwtAccessTokenVerifierAdapter,
  CryptoRefreshTokenGeneratorAdapter,
} from '../security';

export const AUTH_SECURITY_PROVIDERS: Provider[] = [
  {
    provide: ENCRYPTOR,
    useClass: BcryptAdapter,
  },

  {
    provide: ACCESS_TOKEN_GENERATOR,
    useClass: JwtAccessTokenGeneratorAdapter,
  },

  {
    provide: ACCESS_TOKEN_VERIFIER,
    useClass: JwtAccessTokenVerifierAdapter,
  },

  {
    provide: REFRESH_TOKEN_GENERATOR,
    useClass: CryptoRefreshTokenGeneratorAdapter,
  },
];
