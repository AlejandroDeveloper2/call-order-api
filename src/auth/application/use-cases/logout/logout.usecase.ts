import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/** Puertos */
import {
  SESSION_REPOSITORY,
  SessionRepositoryPort,
} from '../../../domain/ports';

/** Errores */
import { AppError } from '../../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepositoryPort,
  ) {}

  async run(accountId: string, refreshToken: string): Promise<void> {
    /** Obtener las sessiones activas asociadas a la cuenta  */
    const sessions = await this.sessionRepository.findByAccountId(accountId);

    /** Comparar el hash del refresh token para filtrar la sesión actual */
    const results = await Promise.all(
      sessions.map(async (session) => {
        const isValid = await bcrypt.compare(
          refreshToken,
          session.refreshTokenHash,
        );
        return { ...session, isValid };
      }),
    );

    const validSession = results.find((r) => r.isValid);

    /** Validar si la sesión es valida */
    if (!validSession)
      throw new AppError(
        AUTH_ERROR_CODES.invalidSession,
        401,
        'Sesión invalida',
        true,
      );

    /** Invalidar la sesión actual */
    await this.sessionRepository.update(validSession.sessionId, {
      revokedAt: new Date(),
    });
  }
}
