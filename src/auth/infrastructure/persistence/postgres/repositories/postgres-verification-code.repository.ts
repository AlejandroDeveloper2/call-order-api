import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

/** Puertos */
import { VerificationCodeRepositoryPort } from '../../../../domain/ports';
import { TransactionContext } from '../../../../../shared/domain/ports';

/** Entidad de dominio */
import { VerificationCode } from '../../../../domain/entities';

/** Esquemas */
import { PostgresVerificationCodeSchema } from '../schemas';

/** Mappers */
import { VerificationCodeMapper } from '../mappers';

/** Adapters */
import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters';
import { VerificationCodeValidationModel } from '../../../../domain/models';
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

@Injectable()
export class PostgresVerificationCodeRepository implements VerificationCodeRepositoryPort {
  constructor(
    @InjectRepository(PostgresVerificationCodeSchema)
    private readonly repository: Repository<PostgresVerificationCodeSchema>,
  ) {}

  private resolveManager(context?: TransactionContext): EntityManager {
    if (context instanceof TypeOrmTransactionContext) {
      return context.manager;
    }

    return this.repository.manager;
  }

  async findForIdentityValidation(
    email: string,
  ): Promise<VerificationCodeValidationModel[]> {
    try {
      const results = await this.repository
        .createQueryBuilder('code')
        .innerJoin('code.account', 'account')
        .innerJoin('account.profile', 'profile')
        .select([
          'code.id',
          'code.codeHash',
          'code.expiresAt',
          'code.accountId',
          'code.attempts',
          'account.email',
          'profile.id',
          'profile.roleId',
          'code.usedAt',
        ])
        .where('account.email = :email', { email })
        .andWhere('code.usedAt IS NULL')
        .getMany();

      return results.map((r) => ({
        verificationCodeId: r.id,
        codeHash: r.codeHash,
        expiresAt: r.expiresAt,
        attempts: r.attempts,
        accountId: r.accountId,
        profile: {
          profileId: r.account.profile.id,
          roleId: r.account.profile.roleId,
        },
      }));
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async findExpiredForForwarding(
    email: string,
  ): Promise<VerificationCodeValidationModel[]> {
    const now = new Date();
    try {
      const results = await this.repository
        .createQueryBuilder('code')
        .innerJoin('code.account', 'account')
        .innerJoin('account.profile', 'profile')
        .select([
          'code.id',
          'code.codeHash',
          'code.expiresAt',
          'code.accountId',
          'code.attempts',
          'account.email',
          'profile.id',
          'profile.roleId',
          'code.usedAt',
        ])
        .where('account.email = :email', { email })
        .andWhere('code.usedAt IS NULL')
        .andWhere('code.expiresAt < :now', { now })
        .getMany();

      return results.map((r) => ({
        verificationCodeId: r.id,
        codeHash: r.codeHash,
        expiresAt: r.expiresAt,
        attempts: r.attempts,
        accountId: r.accountId,
        profile: {
          profileId: r.account.profile.id,
          roleId: r.account.profile.roleId,
        },
      }));
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async create(verificationCode: VerificationCode): Promise<void> {
    try {
      const schema = VerificationCodeMapper.toPersistence(verificationCode);
      await this.repository.save(schema);
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async markAsUsed(
    verificationCodeId: string,
    usedAt: Date,
    context?: TransactionContext,
  ): Promise<number> {
    try {
      const manager = this.resolveManager(context);
      const result = await manager.update(
        PostgresVerificationCodeSchema,
        { id: verificationCodeId },
        { usedAt },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }

  async refresh(
    verificationCodeId: string,
    payload: { attempts: number; codeHash: string; expiresAt: Date },
  ): Promise<number> {
    try {
      const result = await this.repository.update(
        { id: verificationCodeId },
        payload,
      );
      return result.affected || 0;
    } catch (error: unknown) {
      const e = error as Error;
      throw new PersistenceException(e.message);
    }
  }
}
