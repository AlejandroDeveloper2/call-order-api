import { addDays } from 'date-fns';

/** Puertos */
import {
  AccessTokenGeneratorPort,
  AccessTokenVerifierPort,
  RefreshTokenGeneratorPort,
  SessionRepositoryPort,
  TokenHasherPort,
} from '../../../domain/ports';

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
  ) {}

  async run(
    accountId: string,
    oldToken: string,
    refreshToken: string,
  ): Promise<{ token: string; refreshToken: string }> {
    /**  Obtener las sesiones activas por ID de cuenta proporcionado */
    const session = await this.sessionRepository.findActiveToUpdate(accountId);

    /** Validar los token con los value Object respectivos */
    const tokenValue = JwtAccessToken.create(oldToken).toString();
    const refreshTokenValue = RefreshToken.create(refreshToken).toString();

    if (!session) throw new InvalidSessionException('Sesión invalida');

    /** Comparar el hash del token para filtrar la sesión actual */
    const isValid = this.tokenHasher.compare(tokenValue, session.tokenHash);

    /** Validar si la sesión es valida */
    if (!isValid) throw new InvalidSessionException('Sesión invalida');

    /** Validar si el refresh token es valido */
    const isValidRefreshToken = this.tokenHasher.compare(
      refreshTokenValue,
      session.refreshTokenHash,
    );

    if (!isValidRefreshToken)
      throw new InvalidSessionException('Refresh Token invalido');

    /** Obtener el payload del token para crear uno nuevo */
    const oldPayload = await this.accessTokenVerifier.verify(tokenValue);

    /** Generar nuevo token preservando el payload original */
    const newToken: string = await this.accessTokenGenerator.generate({
      accountId: oldPayload.accountId,
      roleId: oldPayload.roleId,
      profileId: oldPayload.profileId,
    });

    /** Validar con el value object */
    const newTokenValue = JwtAccessToken.create(newToken).toString();

    /** Generar nuevo refresh token */
    const newRefreshToken: string = this.refreshTokenGenerator.generate();

    /** Validar con el value object */
    const newRefreshTokenValue =
      RefreshToken.create(newRefreshToken).toString();

    /** Encriptar el nuevo token y refresh token */
    const newTokenHash: string = this.tokenHasher.hash(newTokenValue);
    const newRefreshTokenHash: string =
      this.tokenHasher.hash(newRefreshTokenValue);

    /** Actualizar la sesión con el nuevo token, refresh token , última actividad y tiempo de expiración */
    await this.sessionRepository.refresh(session.sessionId, {
      tokenHash: newTokenHash,
      refreshTokenHash: newRefreshTokenHash,
      lastActivityAt: new Date(),
      expiresAt: addDays(new Date(), 1),
    });

    return {
      token: newTokenValue,
      refreshToken: newRefreshTokenValue,
    };
  }
}
