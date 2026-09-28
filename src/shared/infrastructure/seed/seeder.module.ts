import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/** Seeders */
import { AuthSeeder } from './auth.seeder';

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
  providers: [AuthSeeder],
  exports: [],
})
export class SeederModule {}
