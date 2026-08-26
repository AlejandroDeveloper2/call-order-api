import { Account } from '../../../../domain/entities';

import { PostgresAccountSchema } from '../schemas';

export class AccountMapper {
  static toDomain(schema: PostgresAccountSchema): Account {
    const domain = new Account(
      schema.id,
      schema.email,
      schema.passwordHash,
      schema.mustChangePassword,
      schema.failedAttempts,
      schema.profileId,
      schema.lastLoginAt,
      schema.lockedUntil,
    );
    return domain;
  }

  static toPersistence(domain: Account): PostgresAccountSchema {
    const schema = new PostgresAccountSchema();
    schema.id = domain.getAccountId;
    schema.email = domain.getEmail;
    schema.passwordHash = domain.getPasswordHash;
    schema.mustChangePassword = domain.getMustChangePassword;
    schema.lastLoginAt = domain.getLastLoginAt;
    schema.failedAttempts = domain.getFailedAttempts;
    schema.lockedUntil = domain.getLockedUntil;
    schema.profileId = domain.getProfileId;
    return schema;
  }
}
