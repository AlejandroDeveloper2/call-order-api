import { User } from '../../../../domain/entities';

import { RoleMapper } from './role.mapper';

import { PostgresUserSchema } from '../schemas/postgres-user.schema';

export class UserMapper {
  static toDomain(schema: PostgresUserSchema): User {
    const domain = new User();
    domain.userId = schema.id;
    domain.fullname = schema.fullname;
    domain.avatar = schema.avatar;
    domain.phone = schema.phone;
    domain.role = RoleMapper.toDomain(schema.role);
    domain.isActive = schema.isActive;

    return domain;
  }

  static toPersistence(domain: User): PostgresUserSchema {
    const schema = new PostgresUserSchema();
    schema.id = domain.userId;
    schema.fullname = domain.fullname;
    schema.role = RoleMapper.toPersistence(domain.role);
    schema.avatar = domain.avatar;
    schema.phone = domain.phone;
    schema.isActive = domain.isActive;
    return schema;
  }
}
