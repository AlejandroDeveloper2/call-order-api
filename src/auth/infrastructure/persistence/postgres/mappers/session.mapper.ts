import { Session } from '../../../../domain/entities';

import { PostgresSessionSchema } from '../schemas';

import { AccountMapper } from './account.mapper';

export class SessionMapper {
  static toDomain(schema: PostgresSessionSchema): Session {
    return new Session(
      schema.id,
      schema.accountId,
      schema.tokenHash,
      schema.refreshTokenHash,
      schema.expiresAt,
      schema.lastActivityAt,
      schema.browser,
      schema.operatingSystem,
      schema.ipAddress,
      schema.userAgent,
      schema.revokedAt,
      schema.deviceName,
      schema.deviceType,
      AccountMapper.toDomain(schema.account),
    );
  }

  static toPersistence(domain: Session): PostgresSessionSchema {
    const schema = new PostgresSessionSchema();
    schema.id = domain.sessionId;
    schema.accountId = domain.accountId;
    schema.tokenHash = domain.tokenHash;
    schema.refreshTokenHash = domain.refreshTokenHash;
    schema.browser = domain.browser;
    schema.operatingSystem = domain.operatingSystem;
    schema.ipAddress = domain.ipAddress;
    schema.userAgent = domain.userAgent;
    schema.expiresAt = domain.expiresAt;
    schema.lastActivityAt = domain.lastActivityAt;
    schema.revokedAt = domain.revokedAt;
    schema.deviceName = domain.deviceName;
    schema.deviceType = domain.deviceType;
    return schema;
  }
}
