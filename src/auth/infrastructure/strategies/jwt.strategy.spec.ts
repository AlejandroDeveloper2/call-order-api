import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenExpiredError } from 'jsonwebtoken';

import { ValidateAccessTokenUseCase } from '../../application/use-cases';

import {
  ExpiredTokenException,
  MalformedTokenException,
  MissingTokenException,
} from '../exceptions';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const createStrategy = () => {
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    const validateAccessTokenUseCase = {
      run: jest.fn(),
    } as unknown as ValidateAccessTokenUseCase;

    return {
      strategy: new JwtStrategy(configService, validateAccessTokenUseCase),
      validateAccessTokenUseCase,
    };
  };

  const createContext = (authorization?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    }) as ExecutionContext;

  it('deberia lanzar MissingTokenException cuando no existe Authorization', () => {
    // Arrange
    const { strategy } = createStrategy();

    // Act
    const result = () =>
      strategy.handleRequest(null, {} as never, null, createContext());

    // Assert
    expect(result).toThrow(MissingTokenException);
  });

  it('deberia lanzar ExpiredTokenException cuando el token expiro', () => {
    // Arrange
    const { strategy } = createStrategy();
    const expirationError = new TokenExpiredError('jwt expired', new Date());

    // Act
    const result = () =>
      strategy.handleRequest(
        null,
        {} as never,
        expirationError,
        createContext('Bearer expired-token'),
      );

    // Assert
    expect(result).toThrow(ExpiredTokenException);
  });

  it('deberia lanzar MalformedTokenException cuando Passport informa un error', () => {
    // Arrange
    const { strategy } = createStrategy();

    // Act
    const result = () =>
      strategy.handleRequest(
        new Error('invalid token'),
        false,
        null,
        createContext('Bearer malformed-token'),
      );

    // Assert
    expect(result).toThrow(MalformedTokenException);
  });

  it('deberia devolver el usuario cuando el token es valido', () => {
    // Arrange
    const { strategy } = createStrategy();
    const user = { accountId: 'account-id' };

    // Act
    const result = strategy.handleRequest(
      null,
      user,
      null,
      createContext('Bearer valid-token'),
    );

    // Assert
    expect(result).toBe(user);
  });

  it('deberia delegar la validacion del payload al caso de uso', async () => {
    // Arrange
    const { strategy, validateAccessTokenUseCase } = createStrategy();
    const payload = {
      accountId: 'account-id',
      roleId: 'role-id',
      profileId: 'profile-id',
      permissions: [],
    };
    const runMock = jest.spyOn(validateAccessTokenUseCase, 'run');
    runMock.mockResolvedValue(payload);

    // Act
    const result = await strategy.validate(payload);

    // Assert
    expect(result).toBe(payload);
    expect(runMock.mock.calls).toContainEqual([payload]);
  });
});
