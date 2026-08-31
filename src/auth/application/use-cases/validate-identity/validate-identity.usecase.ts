/** Entidades de dominio */
import { Session } from '../../../domain/entities';

/** Puertos */
import {
  AccessTokenGeneratorPort,
  AccountRepositoryPort,
  RefreshTokenGeneratorPort,
  SessionRepositoryPort,
  TokenHasherPort,
  VerificationCodeLookupPort,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';

import {
  DateHandlerPort,
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
    private readonly tokenHasher: TokenHasherPort,
    private readonly accessTokenGenerator: AccessTokenGeneratorPort,
    private readonly refreshTokenGenerator: RefreshTokenGeneratorPort,
    private readonly verificationCodeLookup: VerificationCodeLookupPort,
    private readonly dateHandler: DateHandlerPort,
  ) {}

  private async validateVerificationCode(
    email: string,
    code: string,
  ): Promise<VerificationCodeValidationModel> {
    /** Validar entradas importantes con los value objects */
    const emailValue = Email.create(email);
    const codeValue = Code.create(code);

    const codeLookup = this.verificationCodeLookup.generateLookup(
      codeValue.toString(),
    );

    /** Obtener el último código de verificación activo  */
    const verificationCode =
      await this.verificationCodeRepository.findForIdentityValidation(
        emailValue.toString(),
        codeLookup,
      );

    if (!verificationCode)
      throw new InvalidCodeException('Código de verificación invalido');

    /** Comparar el hash del código para filtrar el código de verificación actual */
    const isValid = this.tokenHasher.compare(
      codeValue.toString(),
      verificationCode.codeHash,
    );

    if (!isValid)
      throw new InvalidCodeException('Código de verificación invalido');

    return verificationCode;
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
    if (this.dateHandler.isAfter(today, new Date(validCode.expiresAt)))
      throw new ExpiredCodeException(
        'Código de verificación de autenticación ha expirado',
      );

    /** Generar el token y refresh token */
    const generatedToken = await this.accessTokenGenerator.generate({
      accountId: validCode.accountId,
      roleId: validCode.profile.roleId,
      profileId: validCode.profile.profileId,
    });

    const generatedRefreshToken = this.refreshTokenGenerator.generate();

    /** Validar con value objects */
    const token = JwtAccessToken.create(generatedToken);
    const refreshToken = RefreshToken.create(generatedRefreshToken);

    /** Encriptar ambos token para agregar una capa solida de seguridad */
    const tokenHash = this.tokenHasher.hash(token.toString());
    const refreshTokenHash = this.tokenHasher.hash(refreshToken.toString());

    /** Invalidar las sesiones activas anteriores de la misma cuenta en una sola consulta */
    await this.sessionRepository.revokeByAccountId(
      validCode.accountId,
      new Date(),
    );

    /** Crear la nueva sesión a nivel de base de datos con metadatos opcionales */
    const expiresAt = this.dateHandler.addDays(new Date(), 1);
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
      token: token.toString(),
      refreshToken: refreshToken.toString(),
    };
  }
}
