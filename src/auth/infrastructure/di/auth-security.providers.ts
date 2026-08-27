import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ENCRYPTOR,
  ACCESS_TOKEN_GENERATOR,
  ACCESS_TOKEN_VERIFIER,
  REFRESH_TOKEN_GENERATOR,
  VERIFICATION_CODE_LOOK_UP,
  TOKEN_HASHER,
} from '../../domain/ports';

import {
  BcryptAdapter,
  JwtAccessTokenGeneratorAdapter,
  JwtAccessTokenVerifierAdapter,
  CryptoRefreshTokenGeneratorAdapter,
  HmacVerificationCodeLookupAdapter,
  NodeTokenHasherAdapter,
} from '../adapters';

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
  {
    provide: VERIFICATION_CODE_LOOK_UP,
    useFactory: (configService: ConfigService) => {
      const secret = configService.getOrThrow<string>(
        'VERIFICATION_CODE_LOOKUP_SECRET',
      );

      return new HmacVerificationCodeLookupAdapter(secret);
    },
    inject: [ConfigService],
  },
  {
    provide: TOKEN_HASHER,
    useClass: NodeTokenHasherAdapter,
  },
];
