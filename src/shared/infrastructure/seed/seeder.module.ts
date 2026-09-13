import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/** Seeders */
import { AccountSeeder } from './account.seeder';
import { RolesSeeder } from './roles.seeder';

/** Esquemas */
import {
  PostgresAccountSchema,
  PostgresSessionSchema,
  PostgresVerificationCodeSchema,
} from '../../../auth/infrastructure/persistence/postgres/schemas';

import {
  PostgresPermissionSchema,
  PostgresRoleSchema,
  PostgresRolePermissionSchema,
  PostgresUserSchema,
} from '../../../users/infrastructure/persistence/postgres/schemas';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostgresAccountSchema,
      PostgresUserSchema,
      PostgresRoleSchema,
      PostgresPermissionSchema,
      PostgresRolePermissionSchema,
      PostgresSessionSchema,
      PostgresVerificationCodeSchema,
    ]),
  ],
  providers: [AccountSeeder, RolesSeeder],
  exports: [],
})
export class SeederModule {}
