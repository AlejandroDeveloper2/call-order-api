import { Account } from '../../../../domain/entities';

import { PostgresAccountSchema } from '../schemas/postgres-account.schema';

import { AccountMapper } from './account.mapper';

describe('AccountMapper', () => {
  const lastLoginAt = new Date('2026-01-01T10:00:00.000Z');
  const lockedUntil = new Date('2026-01-02T10:00:00.000Z');

  it('deberia convertir un schema de cuenta al dominio', () => {
    // Arrange
    const schema = Object.assign(new PostgresAccountSchema(), {
      id: 'account-id',
      email: 'john@example.com',
      passwordHash: 'password-hash',
      mustChangePassword: true,
      failedAttempts: 2,
      profileId: 'profile-id',
      lastLoginAt,
      lockedUntil,
    });

    // Act
    const result = AccountMapper.toDomain(schema);

    // Assert
    expect(result).toBeInstanceOf(Account);
    expect(result.getAccountId).toBe('account-id');
    expect(result.getEmail).toBe('john@example.com');
    expect(result.getPasswordHash).toBe('password-hash');
    expect(result.getMustChangePassword).toBe(true);
    expect(result.getFailedAttempts).toBe(2);
    expect(result.getProfileId).toBe('profile-id');
    expect(result.getLastLoginAt).toBe(lastLoginAt);
    expect(result.getLockedUntil).toBe(lockedUntil);
  });

  it('deberia convertir una cuenta de dominio al schema de persistencia', () => {
    // Arrange
    const account = Account.create(
      'account-id',
      'john@example.com',
      'password-hash',
      true,
      2,
      'profile-id',
      lastLoginAt,
      lockedUntil,
    );

    // Act
    const result = AccountMapper.toPersistence(account);

    // Assert
    expect(result).toBeInstanceOf(PostgresAccountSchema);
    expect(result).toMatchObject({
      id: 'account-id',
      email: 'john@example.com',
      passwordHash: 'password-hash',
      mustChangePassword: true,
      failedAttempts: 2,
      profileId: 'profile-id',
      lastLoginAt,
      lockedUntil,
    });
  });

  it('deberia conservar valores opcionales indefinidos', () => {
    // Arrange
    const account = Account.create(
      'account-id',
      'john@example.com',
      'password-hash',
      false,
      0,
      'profile-id',
    );

    // Act
    const result = AccountMapper.toPersistence(account);

    // Assert
    expect(result.lastLoginAt).toBeUndefined();
    expect(result.lockedUntil).toBeUndefined();
  });
});
