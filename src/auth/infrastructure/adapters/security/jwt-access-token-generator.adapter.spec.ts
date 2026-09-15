import { JwtService } from '@nestjs/jwt';

import { AccessTokenPayload } from '../../../domain/types';
import { JwtAccessTokenGeneratorAdapter } from './jwt-access-token-generator.adapter';

describe('JwtAccessTokenGeneratorAdapter', () => {
  it('deberia delegar la generacion del token al JwtService', async () => {
    // Arrange
    const payload: AccessTokenPayload = {
      accountId: 'account-id',
      roleId: 'role-id',
      profileId: 'profile-id',
    };
    const signAsync = jest.fn().mockResolvedValue('access-token');
    const jwtService = { signAsync } as unknown as JwtService;
    const adapter = new JwtAccessTokenGeneratorAdapter(jwtService);

    // Act
    const result = await adapter.generate(payload);

    // Assert
    expect(result).toBe('access-token');
    expect(signAsync.mock.calls).toContainEqual([payload]);
  });

  it('deberia propagar el error del JwtService', async () => {
    // Arrange
    const error = new Error('JWT unavailable');
    const signAsync = jest.fn().mockRejectedValue(error);
    const jwtService = { signAsync } as unknown as JwtService;
    const adapter = new JwtAccessTokenGeneratorAdapter(jwtService);

    // Act
    const result = adapter.generate({
      accountId: 'account-id',
      roleId: 'role-id',
      profileId: 'profile-id',
    });

    // Assert
    await expect(result).rejects.toBe(error);
  });
});
