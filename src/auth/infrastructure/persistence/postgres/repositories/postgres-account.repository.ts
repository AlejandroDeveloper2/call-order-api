import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

/** Entidades de Dominio */
import { Account } from '../../../../domain/entities';
/** Puertos */
import { AccountRepositoryPort } from '../../../../domain/ports';
/** Tipos de dominio */
import { UpdateAccountMetaInput } from '../../../../domain/types';
/** Utilidades */
import { handleServerError } from '../../../../../shared/domain/utils/handleServerError';

/** Esquemas */
import { PostgresAccountSchema } from '../schemas';
/** Mappers */
import { AccountMapper } from '../mappers';

@Injectable()
export class PostgresAccountRepository implements AccountRepositoryPort {
  constructor(
    @InjectRepository(PostgresAccountSchema)
    private readonly accountRepository: Repository<PostgresAccountSchema>,
  ) {}
  async findById(accountId: string): Promise<Account | null> {
    try {
      const account = await this.accountRepository.findOneBy({ id: accountId });
      if (!account) return null;
      return AccountMapper.toDomain(account);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async create(account: Account): Promise<void> {
    try {
      const schema = AccountMapper.toPersistence(account);
      await this.accountRepository.save(schema);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async updateEmail(accountId: string, updatedEmail: string): Promise<number> {
    try {
      const result = await this.accountRepository.update(
        { id: accountId },
        { email: updatedEmail },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async updatePassword(
    accountId: string,
    updatedPassword: string,
  ): Promise<number> {
    try {
      const result = await this.accountRepository.update(
        { id: accountId },
        { passwordHash: updatedPassword },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async update(
    accountId: string,
    updateAccountMetaInput: UpdateAccountMetaInput,
  ): Promise<number> {
    try {
      const result = await this.accountRepository.update(
        { id: accountId },
        { ...updateAccountMetaInput },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
}
