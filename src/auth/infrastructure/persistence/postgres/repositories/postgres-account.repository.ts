import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

/** Entidades de Dominio */
import { Account } from '../../../../domain/entities';
/** Puertos */
import { AccountRepositoryPort } from '../../../../domain/ports';
import { TransactionContext } from '../../../../../shared/domain/ports';
/** Tipos de dominio */
import { UpdateAccountMetaInput } from '../../../../domain/types';
/** Utilidades */
import { handleServerError } from '../../../../../shared/domain/utils/handleServerError';

/** Esquemas */
import { PostgresAccountSchema } from '../schemas';
/** Mappers */
import { AccountMapper } from '../mappers';
/** Adaptadores */
import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters';

@Injectable()
export class PostgresAccountRepository implements AccountRepositoryPort {
  constructor(
    @InjectRepository(PostgresAccountSchema)
    private readonly accountRepository: Repository<PostgresAccountSchema>,
  ) { }

  private resolveManager(context?: TransactionContext): EntityManager {
    if (context instanceof TypeOrmTransactionContext) {
      return context.manager;
    }

    return this.accountRepository.manager;
  }
  async findById(accountId: string): Promise<Account | null> {
    try {
      const account = await this.accountRepository.findOneBy({ id: accountId });
      if (!account) return null;
      return AccountMapper.toDomain(account);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }

  async findByEmail(email: string): Promise<Account | null> {
    try {
      const account = await this.accountRepository.findOneBy({ email });
      if (!account) return null;
      return AccountMapper.toDomain(account);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async create(account: Account, context?: TransactionContext): Promise<void> {
    try {
      const manager = this.resolveManager(context);
      const schema = AccountMapper.toPersistence(account);
      await manager.save(schema);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }

  async update(
    accountId: string,
    updateAccountMetaInput: UpdateAccountMetaInput,
    context?: TransactionContext,
  ): Promise<number> {
    try {
      const manager = this.resolveManager(context);
      const result = await manager.update(PostgresAccountSchema, { id: accountId }, updateAccountMetaInput);
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
}
