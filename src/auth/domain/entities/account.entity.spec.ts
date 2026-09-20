import { Account } from './account.entity';

describe('Account', () => {
  describe('create', () => {
    it('deberia crear una cuenta con los datos esperados', () => {
      // Arrange
      const accountId = 'account-id';
      const email = 'user@example.com';
      const passwordHash = 'hashed-password';
      const mustChangePassword = true;
      const failedAttempts = 2;
      const profileId = 'profile-id';
      const lastLoginAt = new Date('2026-01-10T10:00:00.000Z');
      const lockedUntil = new Date('2026-01-11T10:00:00.000Z');

      // Act
      const account = Account.create(
        accountId,
        email,
        passwordHash,
        mustChangePassword,
        failedAttempts,
        profileId,
        lastLoginAt,
        lockedUntil,
      );

      // Assert
      expect(account).toBeInstanceOf(Account);
      expect(account.getAccountId).toBe(accountId);
      expect(account.getEmail).toBe(email);
      expect(account.getPasswordHash).toBe(passwordHash);
      expect(account.getMustChangePassword).toBe(true);
      expect(account.getFailedAttempts).toBe(2);
      expect(account.getProfileId).toBe(profileId);
      expect(account.getLastLoginAt).toBe(lastLoginAt);
      expect(account.getLockedUntil).toBe(lockedUntil);
    });
  });

  describe('incrementFailedAttempts', () => {
    it('deberia incrementar el numero de intentos fallidos', () => {
      // Arrange
      const account = Account.create(
        'account-id',
        'user@example.com',
        'hashed-password',
        false,
        1,
        'profile-id',
      );

      // Act
      account.incrementFailedAttempts();

      // Assert
      expect(account.getFailedAttempts).toBe(2);
    });
  });

  describe('block', () => {
    it('deberia bloquear la cuenta hasta una fecha determinada', () => {
      // Arrange
      const account = Account.create(
        'account-id',
        'user@example.com',
        'hashed-password',
        false,
        0,
        'profile-id',
      );
      const lockUntil = new Date('2026-01-12T10:00:00.000Z');

      // Act
      account.block(lockUntil);

      // Assert
      expect(account.getLockedUntil).toBe(lockUntil);
    });
  });

  describe('resetBlock', () => {
    it('deberia resetear los intentos fallidos y desbloquear la cuenta', () => {
      // Arrange
      const account = Account.create(
        'account-id',
        'user@example.com',
        'hashed-password',
        false,
        4,
        'profile-id',
        new Date('2026-01-10T10:00:00.000Z'),
        new Date('2026-01-11T10:00:00.000Z'),
      );

      // Act
      account.resetBlock();

      // Assert
      expect(account.getFailedAttempts).toBe(0);
      expect(account.getLockedUntil).toBeUndefined();
    });
  });
});
