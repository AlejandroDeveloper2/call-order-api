import { VerificationCode } from '../../../../domain/entities';

import { PostgresVerificationCodeSchema } from '../schemas';

import { AccountMapper } from './account.mapper';

export class VerificationCodeMapper {
  static toDomain(schema: PostgresVerificationCodeSchema): VerificationCode {
    return new VerificationCode(
      schema.id,
      schema.accountId,
      schema.codeHash,
      schema.type,
      schema.expiresAt,
      schema.attempts,
      schema.usedAt,
      AccountMapper.toDomain(schema.account),
    );
  }

  static toPersistence(
    domain: VerificationCode,
  ): PostgresVerificationCodeSchema {
    const schema = new PostgresVerificationCodeSchema();
    schema.id = domain.verificationCodeId;
    schema.accountId = domain.accountId;
    schema.codeHash = domain.codeHash;
    schema.type = domain.type;
    schema.expiresAt = domain.expiresAt;
    schema.attempts = domain.attempts;
    schema.usedAt = domain.usedAt;
    return schema;
  }
}
