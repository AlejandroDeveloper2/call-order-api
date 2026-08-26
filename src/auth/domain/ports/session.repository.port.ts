import { TransactionContext } from '../../../shared/domain/ports';

import { Session } from '../entities';

import { SessionToUpdateModel, SessionValidationModel } from '../models';

export abstract class SessionRepositoryPort {
  abstract findActiveForValidation(
    accountId: string,
  ): Promise<SessionValidationModel | null>;

  abstract findActiveToUpdate(
    accountId: string,
  ): Promise<SessionToUpdateModel | null>;

  abstract create(
    session: Session,
    context?: TransactionContext,
  ): Promise<void>;

  abstract revoke(sessionId: string): Promise<number>;

  abstract refresh(
    sessionId: string,
    payload: {
      tokenHash: string;
      refreshTokenHash: string;
      lastActivityAt: Date;
      expiresAt: Date;
    },
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

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
