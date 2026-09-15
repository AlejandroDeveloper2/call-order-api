import { Session } from '../../../../domain/entities';

import { PostgresSessionSchema } from '../schemas/postgres-session.schema';

import { SessionMapper } from './session.mapper';

describe('SessionMapper', () => {
  const expiresAt = new Date('2026-01-10T10:00:00.000Z');
  const lastActivityAt = new Date('2026-01-01T10:00:00.000Z');
  const revokedAt = new Date('2026-01-02T10:00:00.000Z');

  it('deberia convertir un schema de sesion al dominio', () => {
    // Arrange
    const schema = Object.assign(new PostgresSessionSchema(), {
      id: 'session-id',
      tokenHash: 'token-hash',
      refreshTokenHash: 'refresh-hash',
      expiresAt,
      lastActivityAt,
      accountId: 'account-id',
      browser: 'Chrome',
      operatingSystem: 'Windows',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      revokedAt,
      deviceName: 'Laptop',
      deviceType: 'desktop',
    });

    // Act
    const result = SessionMapper.toDomain(schema);

    // Assert
    expect(result).toBeInstanceOf(Session);
    expect(result.getSessionId).toBe('session-id');
    expect(result.getTokenHash).toBe('token-hash');
    expect(result.getRefreshTokenHash).toBe('refresh-hash');
    expect(result.getExpiresAt).toBe(expiresAt);
    expect(result.getLastActivityAt).toBe(lastActivityAt);
    expect(result.getAccountId).toBe('account-id');
    expect(result.getBrowser).toBe('Chrome');
    expect(result.getOperatingSystem).toBe('Windows');
    expect(result.getIpAddress).toBe('127.0.0.1');
    expect(result.getUserAgent).toBe('Mozilla/5.0');
    expect(result.getRevokedAt).toBe(revokedAt);
    expect(result.getDeviceName).toBe('Laptop');
    expect(result.getDeviceType).toBe('desktop');
  });

  it('deberia convertir una sesion de dominio al schema de persistencia', () => {
    // Arrange
    const session = Session.create(
      'session-id',
      'token-hash',
      'refresh-hash',
      expiresAt,
      lastActivityAt,
      'account-id',
      'Chrome',
      'Windows',
      '127.0.0.1',
      'Mozilla/5.0',
      revokedAt,
      'Laptop',
      'desktop',
    );

    // Act
    const result = SessionMapper.toPersistence(session);

    // Assert
    expect(result).toBeInstanceOf(PostgresSessionSchema);
    expect(result).toMatchObject({
      id: 'session-id',
      tokenHash: 'token-hash',
      refreshTokenHash: 'refresh-hash',
      expiresAt,
      lastActivityAt,
      accountId: 'account-id',
      browser: 'Chrome',
      operatingSystem: 'Windows',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      revokedAt,
      deviceName: 'Laptop',
      deviceType: 'desktop',
    });
  });
});
