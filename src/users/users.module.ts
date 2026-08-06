import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/** Puertos */
import {
  PERMISSION_REPOSITORY,
  ROLE_PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
} from './domain/ports';

/** Casos de uso */
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.usecase';
import { FindUserByAccountUseCase } from './application/use-cases/find-user-by-account/find-user-by-account.usecase';

import { UsersController } from './infrastructure/controllers/users.controller';

import {
  PostgresPermissionRepository,
  PostgresRoleRepository,
  PostgresUserRepository,
  PostgresRolePermissionRepository,
} from './infrastructure/persistence/postgres/repositories';

import {
  PostgresUserSchema,
  PostgresAccountSchema,
  PostgresRoleSchema,
  PostgresPermissionSchema,
  PostgresRolePermissionSchema,
} from './infrastructure/persistence/postgres/schemas';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostgresUserSchema,
      PostgresAccountSchema,
      PostgresRoleSchema,
      PostgresPermissionSchema,
      PostgresRolePermissionSchema,
    ]),
  ],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    FindUserByAccountUseCase,
    { provide: USER_REPOSITORY, useClass: PostgresUserRepository },
    { provide: ROLE_REPOSITORY, useClass: PostgresRoleRepository },
    { provide: PERMISSION_REPOSITORY, useClass: PostgresPermissionRepository },
    {
      provide: ROLE_PERMISSION_REPOSITORY,
      useClass: PostgresRolePermissionRepository,
    },
  ],
})
export class UsersModule {}
