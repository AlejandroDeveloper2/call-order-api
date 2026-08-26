import { VerificationCode } from '../../../../domain/entities';

import { PostgresVerificationCodeSchema } from '../schemas';

export class VerificationCodeMapper {
  static toDomain(schema: PostgresVerificationCodeSchema): VerificationCode {
    return new VerificationCode(
      schema.id,
      schema.codeHash,
      schema.type,
      schema.expiresAt,
      schema.attempts,
      schema.accountId,
      schema.usedAt,
    );
  }

  static toPersistence(
    domain: VerificationCode,
  ): PostgresVerificationCodeSchema {
    const schema = new PostgresVerificationCodeSchema();
    schema.id = domain.getVerificationCodeId;
    schema.codeHash = domain.getCodeHash;
    schema.type = domain.getType;
    schema.expiresAt = domain.getExpiresAt;
    schema.attempts = domain.getAttempts;
    schema.accountId = domain.getAccountId;
    schema.usedAt = domain.getUsedAt;
    return schema;
  }
}
