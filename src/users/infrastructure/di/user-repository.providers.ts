import { Provider } from '@nestjs/common';

import { PERMISSION_REPOSITORY, USER_REPOSITORY } from '../../domain/ports';

import {
  PostgresPermissionRepository,
  PostgresUserRepository,
} from '../persistence/postgres/repositories';

export const USER_REPOSITORY_PROVIDERS: Provider[] = [
  { provide: USER_REPOSITORY, useClass: PostgresUserRepository },
  { provide: PERMISSION_REPOSITORY, useClass: PostgresPermissionRepository },
];
