import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';
/** Entidades de dominio */
import { User } from '../../../domain/entities';
/** Tipos de dominio */
import {
  ListUserQuery,
  UpdateUserInput,
  UserStatus,
} from '../../../domain/types';

/**  Esquema de base de datos */
import { PostgresUserSchema } from './postgres-user.schema';
/** Mapper */
import { UserMapper } from './user.mapper';

@Injectable()
export class PostgresUserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(PostgresUserSchema)
    private readonly repository: Repository<PostgresUserSchema>,
  ) {}

  async find(query: Partial<ListUserQuery>): Promise<User[]> {
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

    const schemas = await qb.getMany();

    return schemas.map((schema) => UserMapper.toDomain(schema));
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
