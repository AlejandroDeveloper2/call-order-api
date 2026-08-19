import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/** Puertos */
import { PERMISSION_REPOSITORY, USER_REPOSITORY } from './domain/ports';

/** Casos de uso */
import {
  FindUserByAccountUseCase,
  FindUsersUseCase,
  UpdateProfileUseCase,
  UpdateUserAvatarUseCase,
  UpdateUserStatusUseCase,
} from './application/use-cases';

/** Controladores */
import { UsersController } from './infrastructure/controllers/users.controller';

/** Repositorios */
import {
  PostgresPermissionRepository,
  PostgresUserRepository,
} from './infrastructure/persistence/postgres/repositories';

/** Esquemas */
import {
  PostgresUserSchema,
  PostgresRoleSchema,
  PostgresPermissionSchema,
  PostgresRolePermissionSchema,
} from './infrastructure/persistence/postgres/schemas';
import { PostgresAccountSchema } from '../auth/infrastructure/persistence/postgres/schemas';

/** Módulos */
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    SharedModule,
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
    FindUserByAccountUseCase,
    FindUsersUseCase,
    UpdateProfileUseCase,
    UpdateUserStatusUseCase,
    UpdateUserAvatarUseCase,
    { provide: USER_REPOSITORY, useClass: PostgresUserRepository },
    { provide: PERMISSION_REPOSITORY, useClass: PostgresPermissionRepository },
  ],
  exports: [USER_REPOSITORY, PERMISSION_REPOSITORY],
})
export class UsersModule { }
