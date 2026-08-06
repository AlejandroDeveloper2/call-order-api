import { RolePermission } from '../../../domain/entities';

import { PostgresRolePermissionSchema } from './postgres-role-permission.schema';

export class RolePermissionMapper {
  static toDomain(schema: PostgresRolePermissionSchema): RolePermission {
    return new RolePermission(schema.id, schema.permissionId, schema.roleId);
  }

  static toPersistence(domain: RolePermission): PostgresRolePermissionSchema {
    const schema = new PostgresRolePermissionSchema();
    schema.id = domain.rolePermissionId;
    schema.permissionId = domain.permissionId;
    schema.roleId = domain.roleId;
    return schema;
  }
}
