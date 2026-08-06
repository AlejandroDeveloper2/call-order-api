import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Puertos */
import { UserRepositoryPort } from '../../../../domain/ports';
/** Entidades de dominio */
import { User, UserSearchQuery } from '../../../../domain/entities';
/** Tipos de dominio */
import { UpdateUserInput, UserStatus } from '../../../../domain/types';

/**  Esquema de base de datos */
import { PostgresUserSchema } from '../schemas';
/** Mapper */
import { UserMapper } from '../mappers';
import { PaginatedResponse } from '../../../../../shared/domain/types';

@Injectable()
export class PostgresUserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(PostgresUserSchema)
    private readonly repository: Repository<PostgresUserSchema>,
  ) {}

  async find(query: UserSearchQuery): Promise<PaginatedResponse<User>> {
    const { limit = 10, offset = 0 } = query;
    const qb = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.account', 'account');

    if (query.status)
      qb.andWhere('user.isActive = :status', {
        status: query.status === UserStatus.ACTIVE,
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
  }
  async findByAccountId(accountId: string): Promise<User | null> {
    const schema = await this.repository.findOneBy({ accountId });
    return schema ? UserMapper.toDomain(schema) : null;
  }
  async create(user: User): Promise<void> {
    const schema = UserMapper.toPersistence(user);
    await this.repository.save(schema);
  }
  async update(
    userId: string,
    updateUserInput: UpdateUserInput,
  ): Promise<number> {
    const result = await this.repository.update(
      { id: userId },
      { ...updateUserInput },
    );
    return result.affected || 0;
  }
  async activate(userId: string): Promise<number> {
    const result = await this.repository.update(
      { id: userId },
      { isActive: true },
    );
    return result.affected || 0;
  }
  async deactivate(userId: string): Promise<number> {
    const result = await this.repository.update(
      { id: userId },
      { isActive: false },
    );
    return result.affected || 0;
  }
}
