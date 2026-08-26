import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/** Controladores */
import { AuthController } from './infrastructure/controllers/auth.controller';

/** Esquemas */
import {
  PostgresAccountSchema,
  PostgresSessionSchema,
  PostgresVerificationCodeSchema,
} from './infrastructure/persistence/postgres/schemas';

/** Módulos */
import { UsersModule } from '../users/users.module';
import { SharedModule } from '../shared/shared.module';

/** Estrategias */
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

/** Guards */
import { PermissionsGuard } from './infrastructure/guards/permissions.guard';

/** Proveedores */
import {
  AUTH_REPOSITORY_PROVIDERS,
  AUTH_SECURITY_PROVIDERS,
  AUTH_USE_CASE_PROVIDERS,
} from './infrastructure/di';

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
    ...AUTH_USE_CASE_PROVIDERS,
    ...AUTH_REPOSITORY_PROVIDERS,
    ...AUTH_SECURITY_PROVIDERS,
  ],
  exports: [PermissionsGuard],
})
export class AuthModule {}
