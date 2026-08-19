import { TransactionContext } from '../../../shared/domain/ports';
import { Session } from '../entities';
import { UpdateSessionInput } from '../types';

export abstract class SessionRepositoryPort {
  abstract findByAccountId(accountId: string): Promise<Session[]>;
  abstract create(
    session: Session,
    context?: TransactionContext,
  ): Promise<void>;
  abstract update(
    sessionId: string,
    updateSessionInput: UpdateSessionInput,
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
