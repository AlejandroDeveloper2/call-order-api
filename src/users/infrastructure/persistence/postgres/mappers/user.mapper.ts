import { Account } from '../../../../../auth/domain/entities';
import { Role, User } from '../../../../domain/entities';

import { PostgresUserSchema } from '../schemas/postgres-user.schema';

export class UserMapper {
  static toDomain(schema: PostgresUserSchema): User {
    return new User(
      schema.id,
      schema.fullname,
      schema.accountId,
      schema.roleId,
      schema.avatar,
      schema.phone,
      schema.isActive,
      schema.account
        ? new Account(
            schema.account.id,
            schema.account.email,
            schema.account.passwordHash,
            schema.account.mustChangePassword,
            schema.account.lastLoginAt,
            schema.account.failedAttempts,
            schema.account.lockedUtil,
          )
        : undefined,
      schema.role ? new Role(schema.role.id, schema.role.name) : undefined,
    );
  }

  static toPersistence(domain: User): PostgresUserSchema {
    const schema = new PostgresUserSchema();
    schema.id = domain.userId;
    schema.fullname = domain.fullname;
    schema.accountId = domain.accountId;
    schema.roleId = domain.roleId;
    schema.avatar = domain.avatar;
    schema.phone = domain.phone;
    schema.isActive = domain.isActive;
    return schema;
  }
}
