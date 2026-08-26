import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

/** Puertos */
import { PermissionRepositoryPort } from '../../../../domain/ports';

/** Entidades de dominio */
import { Permission } from '../../../../domain/entities';

/** Errores de infra */
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

/** Esquema de base de datos */
import {
  PostgresPermissionSchema,
  PostgresRolePermissionSchema,
} from '../schemas';

/** Mappers */
import { PermissionMapper } from '../mappers';

@Injectable()
export class PostgresPermissionRepository implements PermissionRepositoryPort {
  constructor(
    @InjectRepository(PostgresPermissionSchema)
    private readonly permissionRepository: Repository<PostgresPermissionSchema>,
    @InjectRepository(PostgresRolePermissionSchema)
    private rolePermissionRepository: Repository<PostgresRolePermissionSchema>,
  ) {}

  async findPermissionsByRoleId(roleId: string): Promise<Permission[]> {
    try {
      const qb = this.permissionRepository
        .createQueryBuilder('p')
        .innerJoin(PostgresRolePermissionSchema, 'rp', 'rp.permissionId = p.id')
        .where('rp.roleId = :roleId', { roleId });

      const schemas = await qb.getMany();

      return schemas.map((schema) => PermissionMapper.toDomain(schema));
    } catch (e: unknown) {
      const error = e as Error;
      throw new PersistenceException(error.message);
    }
  }
}
