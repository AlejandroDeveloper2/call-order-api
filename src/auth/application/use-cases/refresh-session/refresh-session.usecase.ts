import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { addDays } from 'date-fns';

/** Puertos */
import {
  SESSION_REPOSITORY,
  SessionRepositoryPort,
} from '../../../domain/ports';

/** Errores */
import { AppError } from '../../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Tipos */
import { JwtPayload } from '../../../../shared/domain/types';

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly tokenService: JwtService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepositoryPort,
  ) {}

  async run(
    accountId: string,
    oldToken: string,
    refreshToken: string,
  ): Promise<{ token: string; refreshToken: string }> {
    /** Obtener las sessiones activas asociadas a la cuenta  */
    const sessions = await this.sessionRepository.findByAccountId(accountId);

    /** Comparar el hash del token para filtrar la sesión actual */
    const results = await Promise.all(
      sessions.map(async (session) => {
        const isValid = await bcrypt.compare(oldToken, session.tokenHash);
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

    /** Validar si el refresh token es valido */
    const isValidRefreshToken = await bcrypt.compare(
      refreshToken,
      validSession.refreshTokenHash,
    );

    if (!isValidRefreshToken)
      throw new AppError(
        AUTH_ERROR_CODES.invalidSession,
        401,
        'Refresh Token invalido',
        true,
      );

    /** Obtener el payload del token para crear uno nuevo */
    const oldPayload: JwtPayload = this.tokenService.verify(oldToken, {
      ignoreExpiration: true,
    });

    /** Generar nuevo token preservando el payload original */
    const newToken: string = this.tokenService.sign({
      accountId: oldPayload.accountId,
      roleId: oldPayload.roleId,
      profileId: oldPayload.profileId,
    });

    /** Generar nuevo refresh token */
    const newRefreshToken: string = this.generateRefreshToken();

    /** Encriptar el nuevo token y refresh token */
    const newTokenHash: string = await bcrypt.hash(newToken, 10);
    const newRefreshTokenHash: string = await bcrypt.hash(newRefreshToken, 10);

    /** Actualizar la sesión con el nuevo token y refresh token */
    await this.sessionRepository.update(validSession.sessionId, {
      tokenHash: newTokenHash,
      refreshTokenHash: newRefreshTokenHash,
      lastActivityAt: new Date(),
      expiresAt: addDays(new Date(), 1),
    });

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}
