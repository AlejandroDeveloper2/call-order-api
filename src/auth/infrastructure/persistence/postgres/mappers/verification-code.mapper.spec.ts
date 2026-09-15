import { VerificationCode } from '../../../../domain/entities';

import { PostgresVerificationCodeSchema } from '../schemas/postgres-verification-code.schema';

import { VerificationCodeMapper } from './verification-code.mapper';

describe('VerificationCodeMapper', () => {
  const expiresAt = new Date('2026-01-01T10:00:00.000Z');
  const usedAt = new Date('2026-01-01T11:00:00.000Z');

  it('deberia convertir un schema de codigo al dominio', () => {
    // Arrange
    const schema = Object.assign(new PostgresVerificationCodeSchema(), {
      id: 'code-id',
      codeHash: 'code-hash',
      codeLookup: 'code-lookup',
      type: 'double-factor' as const,
      expiresAt,
      attempts: 1,
      accountId: 'account-id',
      usedAt,
    });

    // Act
    const result = VerificationCodeMapper.toDomain(schema);

    // Assert
    expect(result).toBeInstanceOf(VerificationCode);
    expect(result.getVerificationCodeId).toBe('code-id');
    expect(result.getCodeHash).toBe('code-hash');
    expect(result.getCodeLookup).toBe('code-lookup');
    expect(result.getType).toBe('double-factor');
    expect(result.getExpiresAt).toBe(expiresAt);
    expect(result.getAttempts).toBe(1);
    expect(result.getAccountId).toBe('account-id');
    expect(result.getUsedAt).toBe(usedAt);
  });

  it('deberia convertir un codigo de dominio al schema de persistencia', () => {
    // Arrange
    const verificationCode = VerificationCode.create(
      'code-id',
      'code-hash',
      'code-lookup',
      'double-factor',
      expiresAt,
      1,
      'account-id',
      usedAt,
    );

    // Act
    const result = VerificationCodeMapper.toPersistence(verificationCode);

    // Assert
    expect(result).toBeInstanceOf(PostgresVerificationCodeSchema);
    expect(result).toMatchObject({
      id: 'code-id',
      codeHash: 'code-hash',
      codeLookup: 'code-lookup',
      type: 'double-factor',
      expiresAt,
      attempts: 1,
      accountId: 'account-id',
      usedAt,
    });
  });

  it('deberia conservar usedAt indefinido para un codigo no utilizado', () => {
    // Arrange
    const verificationCode = VerificationCode.create(
      'code-id',
      'code-hash',
      'code-lookup',
      'double-factor',
      expiresAt,
      0,
      'account-id',
    );

    // Act
    const result = VerificationCodeMapper.toPersistence(verificationCode);

    // Assert
    expect(result.usedAt).toBeUndefined();
  });
});
