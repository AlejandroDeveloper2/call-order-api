import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { addHours, addMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';
import * as ports from '../../../../shared/domain/ports';
/** Entidades de dominio */
import { VerificationCode } from '../../../domain/entities';
/** Errores de dominio */
import { AppError } from '../../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';
/** utilidades */
import { generateVerificationCode } from '../../../domain/utils/generate-validation-code';

/** Dto */
import { LoginDto } from '../../dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(VERIFICATION_CODE_REPOSITORY)
    private readonly verificationCodeRepository: VerificationCodeRepositoryPort,
    @Inject(ports.EMAIL_SENDER_KEY)
    private readonly emailSender: ports.EmailSenderPort,
  ) {}

  async run(loginDto: LoginDto): Promise<void> {
    const account = await this.accountRepository.findByEmail(loginDto.email);
    if (!account)
      throw new AppError(
        AUTH_ERROR_CODES.invalidCredentials,
        401,
        'Credenciales invalidas',
        true,
      );

    if (account.lockedUtil && !this.isLockExpired(account.lockedUtil))
      throw new AppError(
        AUTH_ERROR_CODES.loginLocked,
        403,
        'Has superado el número permitido de intentos de inicio de sesión, intenta durante 2 horas.',
        true,
      );

    if (account.lockedUtil && this.isLockExpired(account.lockedUtil)) {
      await this.resetAccountLock(account.accountId);
      account.failedAttempts = 0;
      account.lockedUtil = undefined;
    }

    if (account.profile && !account.profile.isActive)
      throw new AppError(
        AUTH_ERROR_CODES.inactiveAccount,
        403,
        'Usuario inactivo',
        true,
      );

    const isCorrectPassword = await bcrypt.compare(
      loginDto.password,
      account.passwordHash,
    );

    if (!isCorrectPassword) {
      await this.handleInvalidPassword(account);
      throw new AppError(
        AUTH_ERROR_CODES.invalidCredentials,
        401,
        'Credenciales invalidas',
        true,
      );
    }

    await this.generateAndSendVerificationCode(account);
  }

  private isLockExpired(lockedUtil: Date): boolean {
    return lockedUtil.getTime() <= Date.now();
  }

  private async resetAccountLock(accountId: string): Promise<void> {
    await this.accountRepository.update(accountId, {
      failedAttempts: 0,
      lockedUtil: undefined,
    });
  }

  private async handleInvalidPassword(account: {
    accountId: string;
    failedAttempts: number;
  }): Promise<void> {
    const failedAttempts = account.failedAttempts + 1;
    const lockedUtil =
      failedAttempts >= 5 ? addHours(new Date(), 2) : undefined;

    await this.accountRepository.update(account.accountId, {
      failedAttempts,
      lockedUtil,
    });
  }

  private async generateAndSendVerificationCode(account: {
    accountId: string;
    email: string;
  }): Promise<void> {
    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    const verificationCode = new VerificationCode(
      uuidv4(),
      account.accountId,
      codeHash,
      'double-factor',
      addMinutes(new Date(), 10),
      0,
    );

    await this.verificationCodeRepository.create(verificationCode);
    await this.emailSender.sendEmail(
      account.email,
      'Código de verificación de CallOrder',
      this.buildVerificationEmail(code),
    );
  }

  private buildVerificationEmail(code: string): string {
    return `
      <p>Tu código de verificación es:</p>
      <p><strong>${code}</strong></p>
      <p>Este código expirará en 10 minutos.</p>
    `;
  }
}
