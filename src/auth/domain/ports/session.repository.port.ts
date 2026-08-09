import { Session } from '../entities';

export abstract class SessionRepositoryPort {
  abstract findById(sessionId: string): Promise<Session | null>;
  abstract create(session: Session): Promise<void>;
  abstract revoke(sessionId: string, revokedAt: string): Promise<number>;
  abstract updateRefresh(
    sessionId: string,
    refreshTokenHash: string,
  ): Promise<number>;
  abstract updateExpiration(
    sessionId: string,
    expiresAt: string,
  ): Promise<number>;

  abstract updateLastActivity(
    sessionId: string,
    lastActivityAt: string,
  ): Promise<number>;
}
