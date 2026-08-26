import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

/** Entidades de Dominio */
import { Account } from '../../../../domain/entities';

/** Modelos de lectura */
import {
  AccountIdentityValidationModel,
  AccountLoginModel,
  AccountPasswordUpdatingModel,
  AccountTokenValidationModel,
} from '../../../../domain/models';

/** Puertos */
import { AccountRepositoryPort } from '../../../../domain/ports';
import { TransactionContext } from '../../../../../shared/domain/ports';

/** Errores */
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

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
  ) {}

  private resolveManager(context?: TransactionContext): EntityManager {
    if (context instanceof TypeOrmTransactionContext) {
      return context.manager;
    }

    return this.accountRepository.manager;
  }

  async findForLoginByEmail(email: string): Promise<AccountLoginModel | null> {
    try {
      const result = await this.accountRepository
        .createQueryBuilder('account')
        .innerJoinAndSelect('account.profile', 'profile')
        .select([
          'account.id',
          'account.passwordHash',
          'account.failedAttempts',
          'account.lockedUntil',
          'profile.id',
          'profile.isActive',
        ])
        .where('account.email = :email', { email })
        .getOne();

      if (!result) return null;

      return {
        accountId: result.id,
        passwordHash: result.passwordHash,
        failedAttempts: result.failedAttempts,
        lockedUntil: result.lockedUntil,
        profile: {
          isActive: result.profile.isActive,
        },
      };
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async verifyByEmail(email: string): Promise<boolean> {
    try {
      const entityExists = await this.accountRepository.existsBy({ email });
      return entityExists;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async findForIdentityValidation(
    accountId: string,
  ): Promise<AccountIdentityValidationModel | null> {
    try {
      const result = await this.accountRepository
        .createQueryBuilder('account')
        .innerJoinAndSelect('account.profile', 'profile')
        .select([
          'account.id',
          'profile.id',
          'profile.isActive',
          'profile.roleId',
        ])
        .where('account.id = :accountId', { accountId })
        .getOne();

      if (!result) return null;

      return {
        accountId: result.id,
        profile: {
          isActive: result.profile.isActive,
          userId: result.profile.id,
          roleId: result.profile.roleId,
        },
      };
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async findForTokenValidation(
    accountId: string,
  ): Promise<AccountTokenValidationModel | null> {
    try {
      const result = await this.accountRepository
        .createQueryBuilder('account')
        .innerJoinAndSelect('account.profile', 'profile')
        .select([
          'account.id',
          'account.lockedUntil',
          'profile.id',
          'profile.isActive',
          'profile.roleId',
        ])
        .where('account.id = :accountId', { accountId })
        .getOne();

      if (!result) return null;

      return {
        accountId: result.id,
        lockedUntil: result.lockedUntil,
        profile: {
          isActive: result.profile.isActive,
          profileId: result.profile.id,
          roleId: result.profile.roleId,
        },
      };
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async findForUpdatingPassword(
    accountId: string,
  ): Promise<AccountPasswordUpdatingModel | null> {
    try {
      const result = await this.accountRepository
        .createQueryBuilder('account')
        .select(['account.id', 'account.passwordHash'])
        .where('account.id = :accountId', { accountId })
        .getOne();

      if (!result) return null;

      return {
        accountId: result.id,
        passwordHash: result.passwordHash,
      };
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async create(account: Account, context?: TransactionContext): Promise<void> {
    try {
      const manager = this.resolveManager(context);
      const schema = AccountMapper.toPersistence(account);
      await manager.save(schema);
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async updateLastLogin(
    accountId: string,
    lastLoginAt: Date,
    context?: TransactionContext,
  ): Promise<number> {
    try {
      const manager = this.resolveManager(context);
      const result = await manager.update(
        PostgresAccountSchema,
        { id: accountId },
        { lastLoginAt },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async block(
    accountId: string,
    lockedUntil: Date,
    failedAttempts: number,
  ): Promise<number> {
    try {
      const result = await this.accountRepository.update(
        { id: accountId },
        { lockedUntil, failedAttempts },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async unlock(accountId: string): Promise<number> {
    try {
      const result = await this.accountRepository.update(
        { id: accountId },
        { lockedUntil: undefined, failedAttempts: 0 },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async updatePassword(
    accountId: string,
    updatedPasswordHash: string,
  ): Promise<number> {
    try {
      const result = await this.accountRepository.update(
        { id: accountId },
        { passwordHash: updatedPasswordHash },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
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
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }
}
