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

  /**
   * Revoke (invalidate) all active sessions for a given account in a single DB
   * operation. Optionally exclude a session id (useful if revoking others
   * while keeping a newly created one).
   */
  abstract revokeByAccountId(
    accountId: string,
    revokedAt: Date,
    excludeSessionId?: string,
  ): Promise<number>;
}

export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';
