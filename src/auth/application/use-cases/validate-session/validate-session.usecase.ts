/** Puertos */
import {
  AccessTokenVerifierPort,
  EncryptorPort,
  SessionRepositoryPort,
} from '../../../domain/ports';

/** Tipos */
import { AccessTokenPayload } from '../../../domain/types';

/** Errores */
import { InvalidSessionException } from '../../exceptions';

export class ValidateSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly encryptor: EncryptorPort,
    private readonly accessTokenVerifier: AccessTokenVerifierPort,
  ) {}

  async run(
    accountId: string,
    token: string,
  ): Promise<AccessTokenPayload & { token: string }> {
    /** Obtener el payload del token */
    let payload: AccessTokenPayload;
    try {
      payload = await this.accessTokenVerifier.verify(token);
    } catch {
      throw new InvalidSessionException('Token de sesión inválido');
    }

    /** Obtener la sesione asociada al ID de cuenta proporcionado  */
    const session =
      await this.sessionRepository.findActiveForValidation(accountId);

    if (!session) throw new InvalidSessionException('Sesión invalida');

    /** Comparar el hash del token para filtrar la sesión actual */

    const isValid = await this.encryptor.compare(token, session.tokenHash);

    /** Validar si la sesión es valida */
    if (!isValid) throw new InvalidSessionException('Sesión invalida');

    return {
      token,
      ...payload,
    };
  }
}
