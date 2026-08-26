import { Provider } from '@nestjs/common';

import {
  AccountRepositoryPort,
  SessionRepositoryPort,
  VerificationCodeRepositoryPort,
} from '../../domain/ports';

import {
  PostgresAccountRepository,
  PostgresSessionRepository,
  PostgresVerificationCodeRepository,
} from '../persistence/postgres/repositories';

export const AUTH_REPOSITORY_PROVIDERS: Provider[] = [
  {
    provide: AccountRepositoryPort,
    useClass: PostgresAccountRepository,
  },

  {
    provide: SessionRepositoryPort,
    useClass: PostgresSessionRepository,
  },

  {
    provide: VerificationCodeRepositoryPort,
    useClass: PostgresVerificationCodeRepository,
  },
];
