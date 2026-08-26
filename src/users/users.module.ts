import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/** Puertos */
import { PERMISSION_REPOSITORY, USER_REPOSITORY } from './domain/ports';

/** Controladores */
import { UsersController } from './infrastructure/controllers/users.controller';

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

/** proveedores */
import {
  USER_REPOSITORY_PROVIDERS,
  USER_USE_CASE_PROVIDERS,
} from './infrastructure/di';

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
  providers: [...USER_USE_CASE_PROVIDERS, ...USER_REPOSITORY_PROVIDERS],
  exports: [USER_REPOSITORY, PERMISSION_REPOSITORY],
})
export class UsersModule {}
