import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Puertos */
import { PermissionRepositoryPort } from '../../../domain/ports';
/** Entidades de dominio */
import { Permission } from '../../../domain/entities';

/** Esquema de base de datos */
import { PostgresPermissionSchema } from './postgres-permission.schema';
/** Función para mapear o transformar de entidad de dominio a esquema o biseversa  */
import { PermissionMapper } from './permission.mapper';

export class PostgresPermissionRepository implements PermissionRepositoryPort {
  constructor(
    @InjectRepository(PostgresPermissionSchema)
    private readonly repository: Repository<PostgresPermissionSchema>,
  ) {}
  async findById(permissionId: string): Promise<Permission | null> {
    const schema = await this.repository.findOneBy({ id: permissionId });
    return schema ? PermissionMapper.toDomain(schema) : null;
  }
  async findByCode(permissionCode: string): Promise<Permission | null> {
    const schema = await this.repository.findOneBy({ code: permissionCode });
    return schema ? PermissionMapper.toDomain(schema) : null;
  }
  async createMany(permissions: Permission[]): Promise<void> {
    const schemas = permissions.map((permission) =>
      PermissionMapper.toPersistence(permission),
    );
    await this.repository.save(schemas);
  }
}
