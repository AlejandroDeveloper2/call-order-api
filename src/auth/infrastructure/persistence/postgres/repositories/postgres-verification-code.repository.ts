import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

/** Puertos */
import { VerificationCodeRepositoryPort } from '../../../../domain/ports';
import { TransactionContext } from '../../../../../shared/domain/ports';
/** Entidad de dominio */
import { VerificationCode } from '../../../../domain/entities';
import { UpdateCodeInput } from '../../../../domain/types';
/** Utilidades */
import { handleServerError } from '../../../../../shared/domain/utils/handleServerError';

/** Esquemas */
import { PostgresVerificationCodeSchema } from '../schemas';
/** Mappers */
import { VerificationCodeMapper } from '../mappers';
/** Adapters */
import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters';

@Injectable()
export class PostgresVerificationCodeRepository implements VerificationCodeRepositoryPort {
  constructor(
    @InjectRepository(PostgresVerificationCodeSchema)
    private readonly repository: Repository<PostgresVerificationCodeSchema>,
  ) { }

  private resolveManager(context?: TransactionContext): EntityManager {
    if (context instanceof TypeOrmTransactionContext) {
      return context.manager;
    }

    return this.repository.manager;
  }
  async findByAccountId(accountId: string): Promise<VerificationCode[]> {
    try {
      const qb = this.repository
        .createQueryBuilder()
        .select()
        .where('accountId = :accountId', { accountId })
        .andWhere('usedAt IS NULL');

      const schemas = await qb.getMany();

      return schemas.map((schema) => VerificationCodeMapper.toDomain(schema));
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async create(verificationCode: VerificationCode): Promise<void> {
    try {
      const schema = VerificationCodeMapper.toPersistence(verificationCode);
      await this.repository.save(schema);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }

  async update(
    verificationCodeId: string,
    updateCodeInput: UpdateCodeInput,
    context?: TransactionContext,
  ): Promise<number> {
    try {
      const { attempts, codeHash, expiresAt, usedAt } = updateCodeInput;
      const manager = this.resolveManager(context);
      const result = await manager.update(
        PostgresVerificationCodeSchema,
        { id: verificationCodeId },
        { attempts, codeHash, expiresAt, usedAt },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
}
