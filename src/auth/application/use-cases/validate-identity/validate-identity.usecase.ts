import { isAfter, addDays } from 'date-fns';

/** Entidades de dominio */
import { Session } from '../../../domain/entities';

/** Puertos */
import {
  AccessTokenGeneratorPort,
  AccountRepositoryPort,
  EncryptorPort,
  RefreshTokenGeneratorPort,
  SessionRepositoryPort,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';

import {
  IdGeneratorPort,
  TransactionManagerPort,
} from '../../../../shared/domain/ports';

/** Value Objects */
import {
  Code,
  Email,
  JwtAccessToken,
  RefreshToken,
} from '../../../domain/value-objects';

/** Errores de dominio */
import { ExpiredCodeException, InvalidCodeException } from '../../exceptions';

/** Modelos de lectura */
import { VerificationCodeValidationModel } from '../../../domain/models';

/** Commands */
import { ValidateIdentityCommand } from '../../commands';

export class ValidateIdentityUseCase {
  constructor(
    private readonly accountRepository: AccountRepositoryPort,
    private readonly verificationCodeRepository: VerificationCodeRepositoryPort,
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly transactionManager: TransactionManagerPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly encryptor: EncryptorPort,
    private readonly accessTokenGenerator: AccessTokenGeneratorPort,
    private readonly refreshTokenGenerator: RefreshTokenGeneratorPort,
  ) {}

  private async validateVerificationCode(
    email: string,
    code: string,
  ): Promise<VerificationCodeValidationModel> {
    /** Validar entradas importantes con los value objects */
    const emailValue = Email.create(email).toString();
    const codeValue = Code.create(code).toString();

    /** Obtener los códigos de verificación activos  */
    const verificationCodes =
      await this.verificationCodeRepository.findForIdentityValidation(
        emailValue,
      );

    /** Comparar el hash del código para filtrar el código de verificación actual */
    let validCode: VerificationCodeValidationModel | null = null;
    for (const verificationCode of verificationCodes) {
      const isValid = await this.encryptor.compare(
        codeValue,
        verificationCode.codeHash,
      );
      if (isValid) {
        validCode = verificationCode;
        break;
      }
    }

    if (!validCode)
      throw new InvalidCodeException('Código de verificación invalido');

    return validCode;
  }

  async run(
    validateAccountCommand: ValidateIdentityCommand,
  ): Promise<{ token: string; refreshToken: string }> {
    const {
      verificationCode,
      email,
      browser,
      operatingSystem,
      ipAddress,
      userAgent,
      deviceName,
      deviceType,
    } = validateAccountCommand;

    /** Comparar el hash del código para filtrar el código de verificación actual */
    const validCode = await this.validateVerificationCode(
      email,
      verificationCode,
    );

    /** Validar si el código ha expirado */
    const today = new Date();
    if (isAfter(today, new Date(validCode.expiresAt)))
      throw new ExpiredCodeException(
        'Código de verificación de autenticación ha expirado',
      );

    /** Generar el token y refresh token */
    const token = await this.accessTokenGenerator.generate({
      accountId: validCode.accountId,
      roleId: validCode.profile.roleId,
      profileId: validCode.profile.profileId,
    });

    const refreshToken = this.refreshTokenGenerator.generate();

    /** Validar con value objects */
    const tokenValue = JwtAccessToken.create(token).toString();
    const refreshTokenValue = RefreshToken.create(refreshToken).toString();

    /** Encriptar ambos token para agregar una capa solida de seguridad */
    const tokenHash = await this.encryptor.hash(tokenValue, 20);
    const refreshTokenHash = await this.encryptor.hash(refreshTokenValue, 20);

    /** Invalidar las sesiones activas anteriores de la misma cuenta en una sola consulta */
    await this.sessionRepository.revokeByAccountId(
      validCode.accountId,
      new Date(),
    );

    /** Crear la nueva sesión a nivel de base de datos con metadatos opcionales */
    const expiresAt = addDays(new Date(), 1);
    const lastActivityAt = new Date();

    const sessionId = this.idGenerator.generate();

    const session = Session.create(
      sessionId,
      tokenHash,
      refreshTokenHash,
      expiresAt,
      lastActivityAt,
      validCode.accountId,
      browser || 'unknown',
      operatingSystem || 'unknown',
      ipAddress || '0.0.0.0',
      userAgent || '',
      undefined,
      deviceName,
      deviceType,
    );

    await this.transactionManager.run(async (context) => {
      /** Crear sesión */
      await this.sessionRepository.create(session, context);

      /** Invalidar el código de verificación anterior */
      await this.verificationCodeRepository.markAsUsed(
        validCode.verificationCodeId,
        new Date(),
        context,
      );

      /** Actualizar último inicio de sesión */
      await this.accountRepository.updateLastLogin(
        validCode.accountId,
        new Date(),
        context,
      );
    });

    return {
      token: tokenValue,
      refreshToken: refreshTokenValue,
    };
  }
}
