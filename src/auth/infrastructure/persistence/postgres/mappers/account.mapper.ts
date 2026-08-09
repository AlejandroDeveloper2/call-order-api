import { Account } from '../../../../domain/entities';

import { PostgresAccountSchema } from '../schemas';

export class AccountMapper {
  static toDomain(schema: PostgresAccountSchema): Account {
    return new Account(
      schema.id,
      schema.email,
      schema.passwordHash,
      schema.mustChangePassword,
      schema.lastLoginAt,
      schema.failedAttempts,
      schema.lockedUtil,
    );
  }

  static toPersistence(domain: Account): PostgresAccountSchema {
    const schema = new PostgresAccountSchema();
    schema.id = domain.accountId;
    schema.email = domain.email;
    schema.passwordHash = domain.passwordHash;
    schema.mustChangePassword = domain.mustChangePassword;
    schema.lastLoginAt = domain.lastLoginAt;
    schema.failedAttempts = domain.failedAttempts;
    schema.lockedUtil = domain.lockedUtil;
    return schema;
  }
}
