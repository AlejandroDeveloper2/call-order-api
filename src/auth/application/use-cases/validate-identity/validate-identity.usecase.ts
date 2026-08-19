import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { isAfter, addDays } from 'date-fns';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/** Entidades de dominio */
import { Session } from '../../../domain/entities';
/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  SESSION_REPOSITORY,
  SessionRepositoryPort,
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';
import {
  TRANSACTION_MANAGER,
  type TransactionManagerPort,
} from '../../../../shared/domain/ports';
/** Errores de dominio */
import { AppError } from '../../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Dtos */
import { ValidateIdentityDto } from '../../dto';

@Injectable()
export class ValidateIdentityUseCase {
  constructor(
    private readonly tokenService: JwtService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(VERIFICATION_CODE_REPOSITORY)
    private readonly verificationCodeRepository: VerificationCodeRepositoryPort,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepositoryPort,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManagerPort,
  ) { }

  async run(
    validateAccountDto: ValidateIdentityDto,
  ): Promise<{ token: string; refreshToken: string }> {
    /** Validar si el código de verificación es valido */
    const codes = await this.verificationCodeRepository.findByAccountId(
      validateAccountDto.accountId,
    );

    const results = await Promise.all(
      codes.map(async (code) => {
        const isValid = await bcrypt.compare(
          validateAccountDto.verificationCode,
          code.codeHash,
        );
        return { ...code, isValid };
      }),
    );

    const validCode = results.find((r) => r.isValid);

    if (!validCode)
      throw new AppError(
        AUTH_ERROR_CODES.invalidCode,
        401,
        'Código de verificación de autenticación invalido',
        true,
      );

    /** Validar si el código ha expirado */
    const today = new Date();
    if (isAfter(today, new Date(validCode.expiresAt)))
      throw new AppError(
        AUTH_ERROR_CODES.expiredCode,
        401,
        'Código de verificación de autenticación ha expirado',
        true,
      );

    /** Generar el token y refresh token */
    const token = this.tokenService.sign({
      accountId: validCode.accountId,
      roleId: validCode.account?.profile?.roleId as string,
      profileId: validCode.account?.profile?.userId as string,
    });
    const refreshToken = this.generateRefreshToken();
    /** Encriptar ambos token para agregar una capa solida de seguridad */
    const tokenHash = await bcrypt.hash(token, 10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    /** Invalidar las sesiones activas anteriores de la misma cuenta en una sola consulta */
    await this.sessionRepository.revokeByAccountId(
      validCode.accountId,
      new Date(),
    );

    /** Crear la nueva sesión a nivel de base de datos con metadatos opcionales */
    const expiresAt = addDays(new Date(), 1); // coincide con JWT `expiresIn: 1d`
    const lastActivityAt = new Date();

    const session = new Session(
      uuidv4(),
      validCode.accountId,
      tokenHash,
      refreshTokenHash,
      expiresAt,
      lastActivityAt,
      validateAccountDto.browser || 'unknown',
      validateAccountDto.operatingSystem || 'unknown',
      validateAccountDto.ipAddress || '0.0.0.0',
      validateAccountDto.userAgent || '',
      undefined,
      validateAccountDto.deviceName,
      validateAccountDto.deviceType,
    );

    await this.transactionManager.run(async (context) => {
      /** Crear sesión */
      await this.sessionRepository.create(session, context);

      /** Invalidar el código de verificación anterior */
      await this.verificationCodeRepository.update(
        validCode.verificationCodeId,
        {
          usedAt: new Date(),
        },
        context,
      );

      /** Actualizar último inicio de sesión */
      await this.accountRepository.update(
        validateAccountDto.accountId,
        {
          lastLoginAt: new Date(),
        },
        context,
      );
    });

    return {
      token,
      refreshToken,
    };
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}
