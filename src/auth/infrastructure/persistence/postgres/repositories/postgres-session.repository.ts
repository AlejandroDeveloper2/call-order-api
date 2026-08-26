import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

/** Entidad de dominio */
import { Session } from '../../../../domain/entities';

/** Puertos */
import { SessionRepositoryPort } from '../../../../domain/ports';
import { TransactionContext } from '../../../../../shared/domain/ports';

/** Errores */
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

/** Modelos de lectura */
import {
  SessionToUpdateModel,
  SessionValidationModel,
} from '../../../../domain/models';

/** Esquemas */
import { PostgresSessionSchema } from '../schemas';

/** Mappers */
import { SessionMapper } from '../mappers';

/**Adapters */
import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters';

@Injectable()
export class PostgresSessionRepository implements SessionRepositoryPort {
  constructor(
    @InjectRepository(PostgresSessionSchema)
    private readonly sessionRepository: Repository<PostgresSessionSchema>,
  ) {}

  private resolveManager(context?: TransactionContext): EntityManager {
    if (context instanceof TypeOrmTransactionContext) {
      return context.manager;
    }

    return this.sessionRepository.manager;
  }

  async findActiveForValidation(
    accountId: string,
  ): Promise<SessionValidationModel | null> {
    try {
      const result = await this.sessionRepository
        .createQueryBuilder('session')
        .innerJoin('session.account', 'account')
        .select([
          'session.id',
          'session.tokenHash',
          'session.revokedAt',
          'account.id',
        ])
        .where('account.id = :accountId', { accountId })
        .andWhere('session.revokedAt IS NULL')
        .getOne();

      if (!result) return null;

      return { sessionId: result.id, tokenHash: result.tokenHash };
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async findActiveToUpdate(
    accountId: string,
  ): Promise<SessionToUpdateModel | null> {
    try {
      const result = await this.sessionRepository
        .createQueryBuilder('session')
        .innerJoin('session.account', 'account')
        .select([
          'session.id',
          'session.tokenHash',
          'session.refreshTokenHash',
          'session.revokedAt',
          'account.id',
        ])
        .where('account.id = :accountId', { accountId })
        .andWhere('session.revokedAt IS NULL')
        .getOne();

      if (!result) return null;

      return {
        sessionId: result.id,
        tokenHash: result.tokenHash,
        refreshTokenHash: result.refreshTokenHash,
      };
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async create(session: Session, context?: TransactionContext): Promise<void> {
    try {
      const manager = this.resolveManager(context);
      const schema = SessionMapper.toPersistence(session);
      await manager.save(schema);
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async revoke(sessionId: string): Promise<number> {
    try {
      const result = await this.sessionRepository.update(
        { id: sessionId },
        { revokedAt: new Date() },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async refresh(
    sessionId: string,
    payload: {
      tokenHash: string;
      refreshTokenHash: string;
      lastActivityAt: Date;
      expiresAt: Date;
    },
  ): Promise<number> {
    try {
      const result = await this.sessionRepository.update(
        { id: sessionId },
        payload,
      );
      return result.affected || 0;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async revokeByAccountId(
    accountId: string,
    revokedAt: Date,
    excludeSessionId?: string,
  ): Promise<number> {
    try {
      const qb = this.sessionRepository
        .createQueryBuilder()
        .update()
        .set({ revokedAt })
        .where('accountId = :accountId', { accountId })
        .andWhere('revokedAt IS NULL');

      if (excludeSessionId)
        qb.andWhere('id != :excludeId', { excludeId: excludeSessionId });

      const result = await qb.execute();
      return result.affected || 0;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }
}
