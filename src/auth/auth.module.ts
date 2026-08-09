import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  SESSION_REPOSITORY,
  VERIFICATION_CODE_REPOSITORY,
} from './domain/ports';

/** Controladores */
import { AuthController } from './infrastructure/controllers/auth.controller';
/** Esquemas */
import {
  PostgresAccountSchema,
  PostgresSessionSchema,
  PostgresVerificationCodeSchema,
} from './infrastructure/persistence/postgres/schemas';
/** Repositorios */
import {
  PostgresAccountRepository,
  PostgresSessionRepository,
  PostgresVerificationCodeRepository,
} from './infrastructure/persistence/postgres/repositories';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostgresAccountSchema,
      PostgresSessionSchema,
      PostgresVerificationCodeSchema,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PostgresAccountRepository },
    { provide: SESSION_REPOSITORY, useClass: PostgresSessionRepository },
    {
      provide: VERIFICATION_CODE_REPOSITORY,
      useClass: PostgresVerificationCodeRepository,
    },
  ],
})
export class AuthModule {}
