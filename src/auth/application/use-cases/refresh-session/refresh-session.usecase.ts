/** Puertos */
import {
  AccessTokenGeneratorPort,
  AccessTokenVerifierPort,
  RefreshTokenGeneratorPort,
  SessionRepositoryPort,
  TokenHasherPort,
} from '../../../domain/ports';
import { DateHandlerPort } from '../../../../shared/domain/ports';

/** Errores */
import { InvalidSessionException } from '../../exceptions';

/** Value Objects */
import { JwtAccessToken, RefreshToken } from '../../../domain/value-objects';

export class RefreshSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly tokenHasher: TokenHasherPort,
    private readonly accessTokenGenerator: AccessTokenGeneratorPort,
    private readonly accessTokenVerifier: AccessTokenVerifierPort,
    private readonly refreshTokenGenerator: RefreshTokenGeneratorPort,
    private readonly dateHandler: DateHandlerPort,
  ) {}

  async run(
    accountId: string,
    oldToken: string,
    oldRefreshToken: string,
  ): Promise<{ token: string; refreshToken: string }> {
    /** Validar los token con los value Object respectivos */
    const token = JwtAccessToken.create(oldToken);
    const refreshToken = RefreshToken.create(oldRefreshToken);

    /**  Obtener las sesiones activas por ID de cuenta proporcionado */
    const session = await this.sessionRepository.findActiveToUpdate(accountId);

    if (!session) throw new InvalidSessionException('Sesión invalida');

    /** Comparar el hash del token para filtrar la sesión actual */
    const isValid = this.tokenHasher.compare(
      token.toString(),
      session.tokenHash,
    );

    /** Validar si la sesión es valida */
    if (!isValid) throw new InvalidSessionException('Sesión invalida');

    /** Validar si el refresh token es valido */
    const isValidRefreshToken = this.tokenHasher.compare(
      refreshToken.toString(),
      session.refreshTokenHash,
    );

    if (!isValidRefreshToken)
      throw new InvalidSessionException('Refresh Token invalido');

    /** Obtener el payload del token para crear uno nuevo */
    const oldPayload = await this.accessTokenVerifier.verify(token.toString());

    /** Generar nuevo token preservando el payload original */
    const generatedToken: string = await this.accessTokenGenerator.generate({
      accountId: oldPayload.accountId,
      roleId: oldPayload.roleId,
      profileId: oldPayload.profileId,
    });
    /** Generar nuevo refresh token */
    const generatedRefreshToken: string = this.refreshTokenGenerator.generate();

    /** Validar con los value object respectivos */
    const newToken = JwtAccessToken.create(generatedToken);
    const newRefreshToken = RefreshToken.create(generatedRefreshToken);

    /** Encriptar el nuevo token y refresh token */
    const newTokenHash: string = this.tokenHasher.hash(newToken.toString());
    const newRefreshTokenHash: string = this.tokenHasher.hash(
      newRefreshToken.toString(),
    );

    /** Actualizar la sesión con el nuevo token, refresh token , última actividad y tiempo de expiración */
    await this.sessionRepository.refresh(session.sessionId, {
      tokenHash: newTokenHash,
      refreshTokenHash: newRefreshTokenHash,
      lastActivityAt: new Date(),
      expiresAt: this.dateHandler.addDays(new Date(), 1),
    });

    return {
      token: newToken.toString(),
      refreshToken: newRefreshToken.toString(),
    };
  }
}
