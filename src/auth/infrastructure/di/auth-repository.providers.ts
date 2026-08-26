import { Provider } from '@nestjs/common';

import {
  ACCOUNT_REPOSITORY,
  SESSION_REPOSITORY,
  VERIFICATION_CODE_REPOSITORY,
} from '../../domain/ports';

import {
  PostgresAccountRepository,
  PostgresSessionRepository,
  PostgresVerificationCodeRepository,
} from '../persistence/postgres/repositories';

export const AUTH_REPOSITORY_PROVIDERS: Provider[] = [
  {
    provide: ACCOUNT_REPOSITORY,
    useClass: PostgresAccountRepository,
  },

  {
    provide: SESSION_REPOSITORY,
    useClass: PostgresSessionRepository,
  },

  {
    provide: VERIFICATION_CODE_REPOSITORY,
    useClass: PostgresVerificationCodeRepository,
  },
];
