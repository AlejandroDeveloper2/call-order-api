import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

/** Entidad de dominio */
import { Session } from '../../../../domain/entities';
import { UpdateSessionInput } from '../../../../domain/types';
/** Puertos */
import { SessionRepositoryPort } from '../../../../domain/ports';
import { TransactionContext } from '../../../../../shared/domain/ports';
/** Utilidades */
import { handleServerError } from '../../../../../shared/domain/utils/handleServerError';

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
  ) { }

  private resolveManager(context?: TransactionContext): EntityManager {
    if (context instanceof TypeOrmTransactionContext) {
      return context.manager;
    }

    return this.sessionRepository.manager;
  }

  async findByAccountId(accountId: string): Promise<Session[]> {
    try {
      const qb = this.sessionRepository
        .createQueryBuilder()
        .select()
        .where('accountId = :accountId', { accountId })
        .andWhere('revokedAt IS NULL');

      const schemas = await qb.getMany();

      return schemas.map((schema) => SessionMapper.toDomain(schema));
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async create(session: Session, context?: TransactionContext): Promise<void> {
    try {
      const manager = this.resolveManager(context);
      const schema = SessionMapper.toPersistence(session);
      await manager.save(schema);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async update(
    sessionId: string,
    updateSessionInput: UpdateSessionInput,
  ): Promise<number> {
    try {
      const result = await this.sessionRepository.update(
        { id: sessionId },
        { ...updateSessionInput },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
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
      return handleServerError(error);
    }
  }
}
