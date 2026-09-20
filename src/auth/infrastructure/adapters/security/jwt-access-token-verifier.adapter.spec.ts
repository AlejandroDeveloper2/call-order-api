import { JwtService } from '@nestjs/jwt';

import { AccessTokenPayload } from '../../../domain/types';

import { JwtAccessTokenVerifierAdapter } from './jwt-access-token-verifier.adapter';

type JwtServiceMock = Pick<JwtService, 'verifyAsync'>;

describe('JwtAccessTokenVerifierAdapter', () => {
  let jwtServiceMock: jest.Mocked<JwtServiceMock>;

  beforeEach(() => {
    jwtServiceMock = {
      verifyAsync: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('deberia verificar el token ignorando su expiracion', async () => {
    // Arrange
    const payload: AccessTokenPayload = {
      accountId: 'account-id',
      roleId: 'role-id',
      profileId: 'profile-id',
    };
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);
    const adapter = new JwtAccessTokenVerifierAdapter(
      jwtServiceMock as unknown as JwtService,
    );

    // Act
    const result = await adapter.verify('access-token');

    // Assert
    expect(result).toBe(payload);
    expect(jwtServiceMock.verifyAsync.mock.calls).toContainEqual([
      'access-token',
      { ignoreExpiration: true },
    ]);
  });

  it('deberia propagar el error de verificacion del JwtService', async () => {
    // Arrange
    const error = new Error('Invalid token');
    jwtServiceMock.verifyAsync.mockRejectedValue(error);

    const adapter = new JwtAccessTokenVerifierAdapter(
      jwtServiceMock as unknown as JwtService,
    );

    // Act
    const result = adapter.verify('invalid-token');

    // Assert
    await expect(result).rejects.toBe(error);
  });
});
