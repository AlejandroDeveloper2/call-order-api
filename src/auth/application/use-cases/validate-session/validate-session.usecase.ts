import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/** Puertos */
import {
  SESSION_REPOSITORY,
  SessionRepositoryPort,
} from '../../../domain/ports';

/** Tipos */
import { JwtPayload } from '../../../../shared/domain/types';

/** Errores */
import { AppError } from '../../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

@Injectable()
export class ValidateSessionUseCase {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepositoryPort,
  ) {}

  async run(
    accountId: string,
    token: string,
  ): Promise<JwtPayload & { token: string }> {
    /** Obtener el payload del token */
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        ignoreExpiration: true,
      });
    } catch {
      throw new AppError(
        AUTH_ERROR_CODES.invalidSession,
        401,
        'Token de sesión inválido',
        true,
      );
    }

    /** Obtener las sesiones asociadas al Id de la cuenta */
    const sessions = await this.sessionRepository.findByAccountId(accountId);

    const results = await Promise.all(
      sessions.map(async (session) => {
        const isValid = await bcrypt.compare(token, session.tokenHash);
        return { ...session, isValid };
      }),
    );

    /** Validar si la sesión es valida */
    const session = results.find((r) => r.isValid);

    if (!session)
      throw new AppError(
        AUTH_ERROR_CODES.invalidSession,
        401,
        'Sesión invalida',
        true,
      );

    return {
      token,
      ...payload,
    };
  }
}
