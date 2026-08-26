/** Puertos */
import { EncryptorPort, SessionRepositoryPort } from '../../../domain/ports';

/** Errores */
import { InvalidSessionException } from '../../exceptions';

/** Value Objects */
import { JwtAccessToken } from '../../../domain/value-objects';

export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly encryptor: EncryptorPort,
  ) {}

  async run(accountId: string, token: string): Promise<void> {
    /** Obtener la sesión activa por ID de cuenta proporcionado */
    const session =
      await this.sessionRepository.findActiveForValidation(accountId);

    /** Validar el token con el value Object */
    const tokenValue = JwtAccessToken.create(token).toString();

    if (!session) throw new InvalidSessionException('Sesión invalida');

    /** Comparar el hash del token para filtrar la sesión actual */
    const isValid = await this.encryptor.compare(tokenValue, session.tokenHash);

    /** Validar si la sesión es valida */
    if (!isValid) throw new InvalidSessionException('Sesión invalida');

    /** Revocar la sesión actual */
    await this.sessionRepository.revoke(session.sessionId);
  }
}
