import { Session } from './session.entity';

describe('Session', () => {
  describe('create', () => {
    it('deberia crear una sesion con los datos esperados', () => {
      // Arrange
      const sessionId = 'session-id';
      const tokenHash = 'token-hash';
      const refreshTokenHash = 'refresh-token-hash';
      const expiresAt = new Date('2026-01-10T10:00:00.000Z');
      const lastActivityAt = new Date('2026-01-01T10:00:00.000Z');
      const accountId = 'account-id';
      const browser = 'Chrome';
      const operatingSystem = 'Windows';
      const ipAddress = '127.0.0.1';
      const userAgent = 'Mozilla/5.0';
      const revokedAt = new Date('2026-01-02T10:00:00.000Z');
      const deviceName = 'Laptop';
      const deviceType = 'desktop';

      // Act
      const session = Session.create(
        sessionId,
        tokenHash,
        refreshTokenHash,
        expiresAt,
        lastActivityAt,
        accountId,
        browser,
        operatingSystem,
        ipAddress,
        userAgent,
        revokedAt,
        deviceName,
        deviceType,
      );

      // Assert
      expect(session).toBeInstanceOf(Session);
      expect(session.getSessionId).toBe(sessionId);
      expect(session.getTokenHash).toBe(tokenHash);
      expect(session.getRefreshTokenHash).toBe(refreshTokenHash);
      expect(session.getExpiresAt).toBe(expiresAt);
      expect(session.getLastActivityAt).toBe(lastActivityAt);
      expect(session.getAccountId).toBe(accountId);
      expect(session.getBrowser).toBe(browser);
      expect(session.getOperatingSystem).toBe(operatingSystem);
      expect(session.getIpAddress).toBe(ipAddress);
      expect(session.getUserAgent).toBe(userAgent);
      expect(session.getRevokedAt).toBe(revokedAt);
      expect(session.getDeviceName).toBe(deviceName);
      expect(session.getDeviceType).toBe(deviceType);
    });
  });
});
