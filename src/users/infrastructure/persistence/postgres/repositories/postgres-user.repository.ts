import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';

/** Puertos */
import { UserRepositoryPort } from '../../../../domain/ports';
/** Entidades de dominio */
import { User, UserSearchQuery } from '../../../../domain/entities';
import { TransactionContext } from '../../../../../shared/domain/ports';
/** Tipos de dominio */
/** Tipos de dominio */
import { UpdateUserInput } from '../../../../domain/types';
import { PaginatedResponse } from '../../../../../shared/domain/types';
/** Utilidades de dominio */
import { handleServerError } from '../../../../../shared/domain/utils/handleServerError';

/**  Esquema de base de datos */
import { PostgresUserSchema } from '../schemas';
/** Mapper */
import { UserMapper } from '../mappers';
/** Adaptadores */
import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters';

@Injectable()
export class PostgresUserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(PostgresUserSchema)
    private readonly repository: Repository<PostgresUserSchema>,
  ) {}

  private resolveManager(context?: TransactionContext): EntityManager {
    if (context instanceof TypeOrmTransactionContext) {
      return context.manager;
    }

    return this.repository.manager;
  }

  async find(query: UserSearchQuery): Promise<PaginatedResponse<User>> {
    try {
      const { limit = 10, offset = 0 } = query;
      const qb = this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.account', 'account');

      if (query.status)
        qb.andWhere('user.isActive = :status', {
          status: query.status === 'active',
        });

      if (query.fullname)
        qb.andWhere('user.fullname ILIKE :fullname', {
          fullname: `%${query.fullname}%`,
        });

      if (query.email)
        qb.andWhere('account.email ILIKE :email', {
          email: `%${query.email}%`,
        });

      if (query.phone)
        qb.andWhere('user.phone ILIKE :phone', { phone: `%${query.phone}%` });

      if (query.roleId)
        qb.andWhere('user.roleId = :roleId', { roleId: query.roleId });

      qb.skip(offset).take(limit);

      const [schemas, totalRecords] = await qb.getManyAndCount();
      const page = Math.floor(offset / limit) + 1;
      const totalPages = limit > 0 ? Math.ceil(totalRecords / limit) : 0;

      return {
        records: schemas.map((schema) => UserMapper.toDomain(schema)),
        page,
        totalPages,
        totalRecords,
      };
    } catch (e: unknown) {
      return handleServerError(e);
    }
  }
  async findByAccountId(accountId: string): Promise<User | null> {
    try {
      const schema = await this.repository.findOneBy({ accountId });
      return schema ? UserMapper.toDomain(schema) : null;
    } catch (e: unknown) {
      return handleServerError(e);
    }
  }
  async create(user: User, context?: TransactionContext): Promise<void> {
    try {
      const manager = this.resolveManager(context);
      const schema = UserMapper.toPersistence(user);
      await manager.save(schema);
    } catch (e: unknown) {
      return handleServerError(e);
    }
  }
  async update(
    userId: string,
    updateUserInput: UpdateUserInput,
  ): Promise<number> {
    try {
      const result = await this.repository.update(
        { id: userId },
        { ...updateUserInput },
      );
      return result.affected || 0;
    } catch (e: unknown) {
      return handleServerError(e);
    }
  }
  async activate(userId: string): Promise<number> {
    try {
      const result = await this.repository.update(
        { id: userId },
        { isActive: true },
      );
      return result.affected || 0;
    } catch (e: unknown) {
      return handleServerError(e);
    }
  }
  async deactivate(userId: string): Promise<number> {
    try {
      const result = await this.repository.update(
        { id: userId },
        { isActive: false },
      );
      return result.affected || 0;
    } catch (e: unknown) {
      return handleServerError(e);
    }
  }
}
