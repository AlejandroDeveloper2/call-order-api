import { JwtService } from '@nestjs/jwt';

import { AccessTokenPayload } from '../../../domain/types';

import { JwtAccessTokenGeneratorAdapter } from './jwt-access-token-generator.adapter';

type JwtServiceMock = Pick<JwtService, 'signAsync'>;

describe('JwtAccessTokenGeneratorAdapter', () => {
  let jwtServiceMock: jest.Mocked<JwtServiceMock>;

  beforeEach(() => {
    jwtServiceMock = {
      signAsync: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('deberia delegar la generacion del token al JwtService', async () => {
    // Arrange
    const payload: AccessTokenPayload = {
      accountId: 'account-id',
      roleId: 'role-id',
      profileId: 'profile-id',
    };
    jwtServiceMock.signAsync.mockResolvedValue('access-token');

    const adapter = new JwtAccessTokenGeneratorAdapter(
      jwtServiceMock as unknown as JwtService,
    );

    // Act
    const result = await adapter.generate(payload);

    // Assert
    expect(result).toBe('access-token');
    expect(jwtServiceMock.signAsync.mock.calls).toContainEqual([payload]);
  });

  it('deberia propagar el error del JwtService', async () => {
    // Arrange
    const error = new Error('JWT unavailable');
    jwtServiceMock.signAsync.mockRejectedValue(error);

    const adapter = new JwtAccessTokenGeneratorAdapter(
      jwtServiceMock as unknown as JwtService,
    );

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
