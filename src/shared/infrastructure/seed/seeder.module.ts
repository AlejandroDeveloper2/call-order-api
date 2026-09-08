import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountSeeder } from './account.seeder';

/** Esquemas */
import {
  PostgresAccountSchema,
  PostgresSessionSchema,
  PostgresVerificationCodeSchema,
} from '../../../auth/infrastructure/persistence/postgres/schemas';
import {
  PostgresRoleSchema,
  PostgresUserSchema,
} from '../../../users/infrastructure/persistence/postgres/schemas';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostgresAccountSchema,
      PostgresUserSchema,
      PostgresRoleSchema,
      PostgresSessionSchema,
      PostgresVerificationCodeSchema,
    ]),
  ],
  providers: [AccountSeeder],
  exports: [],
})
export class SeederModule {}
