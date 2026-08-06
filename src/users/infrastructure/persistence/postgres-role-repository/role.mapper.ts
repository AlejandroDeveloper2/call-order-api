import { Role } from '../../../domain/entities';

import { PostgresRoleSchema } from './postgres-role.schema';

export class RoleMapper {
  static toDomain(schema: PostgresRoleSchema): Role {
    return new Role(schema.id, schema.name);
  }

  static toPersistence(domain: Role): PostgresRoleSchema {
    const schema = new PostgresRoleSchema();
    schema.id = domain.roleId;
    schema.name = domain.name;
    return schema;
  }
}
