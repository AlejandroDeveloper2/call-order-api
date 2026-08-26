import { User } from '../../../../domain/entities';

import { PostgresUserSchema } from '../schemas/postgres-user.schema';

export class UserMapper {
  static toDomain(schema: PostgresUserSchema): User {
    const domain = User.create(
      schema.id,
      schema.fullname,
      schema.roleId,
      schema.avatar,
      schema.phone,
      schema.isActive,
    );

    return domain;
  }

  static toPersistence(domain: User): PostgresUserSchema {
    const schema = new PostgresUserSchema();
    schema.id = domain.getUserId;
    schema.fullname = domain.getFullname;
    schema.roleId = domain.getRoleId;
    schema.avatar = domain.getAvatar;
    schema.phone = domain.getPhone;
    schema.isActive = domain.getIsActive;
    return schema;
  }
}
