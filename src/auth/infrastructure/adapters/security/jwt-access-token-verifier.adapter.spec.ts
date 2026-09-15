import { JwtService } from '@nestjs/jwt';

import { AccessTokenPayload } from '../../../domain/types';
import { JwtAccessTokenVerifierAdapter } from './jwt-access-token-verifier.adapter';

describe('JwtAccessTokenVerifierAdapter', () => {
  it('deberia verificar el token ignorando su expiracion', async () => {
    // Arrange
    const payload: AccessTokenPayload = {
      accountId: 'account-id',
      roleId: 'role-id',
      profileId: 'profile-id',
    };
    const verifyAsync = jest.fn().mockResolvedValue(payload);
    const jwtService = { verifyAsync } as unknown as JwtService;
    const adapter = new JwtAccessTokenVerifierAdapter(jwtService);

    // Act
    const result = await adapter.verify('access-token');

    // Assert
    expect(result).toBe(payload);
    expect(verifyAsync.mock.calls).toContainEqual([
      'access-token',
      { ignoreExpiration: true },
    ]);
  });

  it('deberia propagar el error de verificacion del JwtService', async () => {
    // Arrange
    const error = new Error('Invalid token');
    const verifyAsync = jest.fn().mockRejectedValue(error);
    const jwtService = { verifyAsync } as unknown as JwtService;
    const adapter = new JwtAccessTokenVerifierAdapter(jwtService);

    // Act
    const result = adapter.verify('invalid-token');

    // Assert
    await expect(result).rejects.toBe(error);
  });
});
