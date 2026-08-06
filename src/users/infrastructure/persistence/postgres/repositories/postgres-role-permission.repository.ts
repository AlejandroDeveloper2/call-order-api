import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** */
import { RolePermissionRepositoryPort } from '../../../../domain/ports';
import { RolePermission } from '../../../../domain/entities';

/** Esquema de base de datos para permisos de rol */
import { PostgresRolePermissionSchema } from '../schemas';

@Injectable()
export class PostgresRolePermissionRepository implements RolePermissionRepositoryPort {
  constructor(
    @InjectRepository(PostgresRolePermissionSchema)
    private readonly repository: Repository<PostgresRolePermissionSchema>,
  ) {}
  async findById(rolePermissionId: string): Promise<RolePermission | null> {
    const schema = await this.repository.findOneBy({ id: rolePermissionId });
    return schema
      ? new RolePermission(schema.id, schema.permissionId, schema.roleId)
      : null;
  }
  async findByRoleId(roleId: string): Promise<RolePermission[]> {
    const schemas = await this.repository.find({ where: { roleId } });
    return schemas.map(
      (schema) =>
        new RolePermission(schema.id, schema.permissionId, schema.roleId),
    );
  }
  async createMany(rolePermissions: RolePermission[]): Promise<void> {
    const schemas = rolePermissions.map((rolePermission) => {
      const schema = new PostgresRolePermissionSchema();
      schema.id = rolePermission.rolePermissionId;
      schema.permissionId = rolePermission.permissionId;
      schema.roleId = rolePermission.roleId;
      return schema;
    });
    await this.repository.save(schemas);
  }
}
