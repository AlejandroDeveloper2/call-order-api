/** Puertos */
import {
  AccountRepositoryPort,
  EncryptorPort,
  VerificationCodeLookupPort,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';
import {
  EmailSenderPort,
  IdGeneratorPort,
  DateHandlerPort,
} from '../../../../shared/domain/ports';

/** Entidades de dominio */
import { VerificationCode } from '../../../domain/entities';

/** Errores de dominio */
import {
  AccountLockedException,
  InactiveAccountException,
  InvalidCredentialsException,
} from '../../exceptions';

/** Value Objects */
import { Code, Email } from '../../../domain/value-objects';

/** Modelos de lectura */
import { AccountLoginModel } from '../../../domain/models';

/** Commands */
import { LoginCommand } from '../../commands';

export class LoginUseCase {
  constructor(
    private readonly accountRepository: AccountRepositoryPort,
    private readonly verificationCodeRepository: VerificationCodeRepositoryPort,
    private readonly emailSender: EmailSenderPort,
    private readonly encryptor: EncryptorPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly verificationCodeLookup: VerificationCodeLookupPort,
    private readonly dateHandler: DateHandlerPort,
  ) {}

  async run(loginCommand: LoginCommand): Promise<void> {
    /** Validamos la entrada con el value object  */
    const email = Email.create(loginCommand.email);

    /** Buscamos la cuenta asociada al email proporcionado */
    const account = await this.accountRepository.findForLoginByEmail(
      email.toString(),
    );

    /** Validamos si las credenciales son validas */
    if (!account)
      throw new InvalidCredentialsException('Credenciales invalidas');

    /** Validamos si el usuario tiene la cuenta bloqueada por exceso de intentos fallidos de login */
    if (account.lockedUntil && !this.isLockExpired(account.lockedUntil))
      throw new AccountLockedException(
        'Has superado el número permitido de intentos de inicio de sesión, intenta durante 2 horas.',
      );

    /** Resetear los intentos y fecha limite de bloqueo si el tiempo de bloqueo ha expirado */
    if (account.lockedUntil && this.isLockExpired(account.lockedUntil)) {
      await this.resetAccountLock(account.accountId);
      account.failedAttempts = 0;
      account.lockedUntil = undefined;
    }

    /** Validar si el perfil esta activo */
    if (!account.profile.isActive)
      throw new InactiveAccountException('Usuario inactivo');

    /** Validar si la contraseña es valida */
    const isCorrectPassword = await this.encryptor.compare(
      loginCommand.password,
      account.passwordHash,
    );

    /** Si la contraseña es incorrecta gestionar la función de bloqueo de login */
    if (!isCorrectPassword) {
      await this.handleInvalidPassword({
        accountId: account.accountId,
        failedAttempts: account.failedAttempts,
      });
      throw new InvalidCredentialsException('Credenciales invalidas');
    }

    /** Generar, crear y enviar el código de verificación de identidad al correo del usuario */
    await this.generateAndSendVerificationCode({
      ...account,
      email: email.toString(),
    });
  }

  private isLockExpired(lockedUtil: Date): boolean {
    return lockedUtil.getTime() <= Date.now();
  }

  private async resetAccountLock(accountId: string): Promise<void> {
    await this.accountRepository.unlock(accountId);
  }

  private async handleInvalidPassword(account: {
    accountId: string;
    failedAttempts: number;
  }): Promise<void> {
    const failedAttempts = account.failedAttempts + 1;
    const lockedUtil =
      failedAttempts >= 5
        ? this.dateHandler.addHours(new Date(), 2)
        : undefined;

    await this.accountRepository.block(
      account.accountId,
      failedAttempts,
      lockedUtil,
    );
  }

  private async generateAndSendVerificationCode(
    account: AccountLoginModel & { email: string },
  ): Promise<void> {
    const codeId = this.idGenerator.generate();

    const code = Code.create(VerificationCode.generate());

    const codeLookup = this.verificationCodeLookup.generateLookup(
      code.toString(),
    );

    const codeHash = await this.encryptor.hash(code.toString(), 10);

    const verificationCode = VerificationCode.create(
      codeId,
      codeHash,
      codeLookup,
      'double-factor',
      this.dateHandler.addMinutes(new Date(), 10),
      0,
      account.accountId,
    );

    await this.verificationCodeRepository.create(verificationCode);
    await this.emailSender.sendEmail(
      account.email,
      'Código de verificación de CallOrder',
      this.buildVerificationEmail(code.toString()),
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
