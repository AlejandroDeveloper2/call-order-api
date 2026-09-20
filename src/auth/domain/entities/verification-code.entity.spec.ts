import { VerificationCode } from './verification-code.entity';

describe('VerificationCode', () => {
  describe('create', () => {
    it('deberia crear un codigo de verificacion con los datos esperados', () => {
      // Arrange
      const verificationCodeId = 'verification-code-id';
      const codeHash = 'hashed-code';
      const codeLookup = 'lookup-code';
      const type = 'double-factor' as const;
      const expiresAt = new Date('2026-01-10T10:00:00.000Z');
      const attempts = 2;
      const accountId = 'account-id';
      const usedAt = new Date('2026-01-10T10:30:00.000Z');

      // Act
      const verificationCode = VerificationCode.create(
        verificationCodeId,
        codeHash,
        codeLookup,
        type,
        expiresAt,
        attempts,
        accountId,
        usedAt,
      );

      // Assert
      expect(verificationCode).toBeInstanceOf(VerificationCode);
      expect(verificationCode.getVerificationCodeId).toBe(verificationCodeId);
      expect(verificationCode.getCodeHash).toBe(codeHash);
      expect(verificationCode.getCodeLookup).toBe(codeLookup);
      expect(verificationCode.getType).toBe(type);
      expect(verificationCode.getExpiresAt).toBe(expiresAt);
      expect(verificationCode.getAttempts).toBe(attempts);
      expect(verificationCode.getAccountId).toBe(accountId);
      expect(verificationCode.getUsedAt).toBe(usedAt);
    });
  });

  describe('generate', () => {
    it('deberia generar un codigo numerico de seis digitos', () => {
      // Arrange
      // Act
      const result = VerificationCode.generate();

      // Assert
      expect(result).toMatch(/^\d{6}$/);
    });
  });

  describe('incrementAttempts', () => {
    it('deberia incrementar la cantidad de intentos', () => {
      // Arrange
      const verificationCode = VerificationCode.create(
        'verification-code-id',
        'hashed-code',
        'lookup-code',
        'double-factor',
        new Date('2026-01-10T10:00:00.000Z'),
        1,
        'account-id',
      );

      // Act
      verificationCode.incrementAttempts();

      // Assert
      expect(verificationCode.getAttempts).toBe(2);
    });
  });
});
