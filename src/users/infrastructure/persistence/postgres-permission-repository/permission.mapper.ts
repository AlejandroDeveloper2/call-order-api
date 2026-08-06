/** Entidad de dominio */
import { Permission } from '../../../domain/entities';

/** Mapper for converting between Permission domain entity and PostgresPermissionSchema */
import { PostgresPermissionSchema } from './postgres-permission.schema';

export class PermissionMapper {
  static toDomain(schema: PostgresPermissionSchema): Permission {
    return new Permission(schema.id, schema.code, schema.description);
  }

  static toPersistence(domain: Permission): PostgresPermissionSchema {
    const schema = new PostgresPermissionSchema();
    schema.id = domain.permissionId;
    schema.code = domain.code;
    schema.description = domain.description;
    return schema;
  }
}
