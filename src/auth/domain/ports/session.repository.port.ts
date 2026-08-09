import { Session } from '../entities';

export abstract class SessionRepositoryPort {
  abstract findById(sessionId: string): Promise<Session | null>;
  abstract create(session: Session): Promise<void>;
  abstract revoke(sessionId: string, revokedAt: Date): Promise<number>;
  abstract updateRefresh(
    sessionId: string,
    refreshTokenHash: string,
  ): Promise<number>;
  abstract updateExpiration(
    sessionId: string,
    expiresAt: Date,
  ): Promise<number>;

  abstract updateLastActivity(
    sessionId: string,
    lastActivityAt: Date,
  ): Promise<number>;
}

export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';
