import { Session } from '../../../../domain/entities';

import { PostgresSessionSchema } from '../schemas';

export class SessionMapper {
  static toDomain(schema: PostgresSessionSchema): Session {
    return new Session(
      schema.id,
      schema.tokenHash,
      schema.refreshTokenHash,
      schema.expiresAt,
      schema.lastActivityAt,
      schema.accountId,
      schema.browser,
      schema.operatingSystem,
      schema.ipAddress,
      schema.userAgent,
      schema.revokedAt,
      schema.deviceName,
      schema.deviceType,
    );
  }

  static toPersistence(domain: Session): PostgresSessionSchema {
    const schema = new PostgresSessionSchema();
    schema.id = domain.getSessionId;
    schema.tokenHash = domain.getTokenHash;
    schema.refreshTokenHash = domain.getRefreshTokenHash;
    schema.browser = domain.getBrowser;
    schema.operatingSystem = domain.getOperatingSystem;
    schema.ipAddress = domain.getIpAddress;
    schema.userAgent = domain.getUserAgent;
    schema.expiresAt = domain.getExpiresAt;
    schema.lastActivityAt = domain.getLastActivityAt;
    schema.accountId = domain.getAccountId;
    schema.revokedAt = domain.getRevokedAt;
    schema.deviceName = domain.getDeviceName;
    schema.deviceType = domain.getDeviceType;
    return schema;
  }
}
