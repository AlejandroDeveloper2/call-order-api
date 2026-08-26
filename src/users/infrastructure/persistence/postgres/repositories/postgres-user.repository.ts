import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';

/** Puertos */
import { UserRepositoryPort } from '../../../../domain/ports';
import { TransactionContext } from '../../../../../shared/domain/ports';

/** Entidades de dominio */
import { User } from '../../../../domain/entities';

/** Tipos de dominio */
import { UpdateUserInput } from '../../../../domain/types';

/** Errores de infra */
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

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

  async findById(profileId: string): Promise<User | null> {
    try {
      const schema = await this.repository.findOneBy({
        id: profileId,
      });
      return schema ? UserMapper.toDomain(schema) : null;
    } catch (e: unknown) {
      const error = e as Error;
      throw new PersistenceException(error.message);
    }
  }
  async create(user: User, context?: TransactionContext): Promise<void> {
    try {
      const manager = this.resolveManager(context);
      const schema = UserMapper.toPersistence(user);
      await manager.save(schema);
    } catch (e: unknown) {
      const error = e as Error;
      throw new PersistenceException(error.message);
    }
  }
  async updateProfile(
    userId: string,
    updateUserInput: UpdateUserInput,
  ): Promise<number> {
    try {
      const result = await this.repository.update(
        { id: userId },
        updateUserInput,
      );
      return result.affected || 0;
    } catch (e: unknown) {
      const error = e as Error;
      throw new PersistenceException(error.message);
    }
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<number> {
    try {
      const result = await this.repository.update(
        { id: userId },
        { avatar: avatarUrl },
      );
      return result.affected || 0;
    } catch (e: unknown) {
      const error = e as Error;
      throw new PersistenceException(error.message);
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
      const error = e as Error;
      throw new PersistenceException(error.message);
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
      const error = e as Error;
      throw new PersistenceException(error.message);
    }
  }
}
