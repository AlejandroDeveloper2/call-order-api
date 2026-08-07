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
import {
  CreateUserUseCase,
  FindUserByAccountUseCase,
  FindUsersUseCase,
  UpdateProfileUseCase,
  UpdateUserStatusUseCase,
} from './application/use-cases';

/** Controladores */
import { UsersController } from './infrastructure/controllers/users.controller';

/** Repositorios */
import {
  PostgresPermissionRepository,
  PostgresRoleRepository,
  PostgresUserRepository,
  PostgresRolePermissionRepository,
} from './infrastructure/persistence/postgres/repositories';

/** Esquemas */
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
    FindUsersUseCase,
    UpdateProfileUseCase,
    UpdateUserStatusUseCase,
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
