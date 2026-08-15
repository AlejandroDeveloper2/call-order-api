import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  SESSION_REPOSITORY,
  VERIFICATION_CODE_REPOSITORY,
} from './domain/ports';

/** Casos de uso */
import {
  CreateAccountUseCase,
  LoginUseCase,
  ValidateIdentityUseCase,
} from './application/use-cases';

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

/** Módulos */
import { UsersModule } from '../users/users.module';
import { SharedModule } from '../shared/shared.module';

/** Estrategias */
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

/** Guards */
import { PermissionsGuard } from './infrastructure/guards/permissions.guard';

@Module({
  imports: [
    SharedModule,
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      PostgresAccountSchema,
      PostgresSessionSchema,
      PostgresVerificationCodeSchema,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    PermissionsGuard,
    LoginUseCase,
    ValidateIdentityUseCase,
    CreateAccountUseCase,
    { provide: ACCOUNT_REPOSITORY, useClass: PostgresAccountRepository },
    { provide: SESSION_REPOSITORY, useClass: PostgresSessionRepository },
    {
      provide: VERIFICATION_CODE_REPOSITORY,
      useClass: PostgresVerificationCodeRepository,
    },
  ],
  exports: [PermissionsGuard],
})
export class AuthModule {}
