import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenExpiredError } from 'jsonwebtoken';

/** Casos de uso */
import { ValidateAccessTokenUseCase } from '../../application/use-cases';

/** Excepciones */
import {
  ExpiredTokenException,
  MalformedTokenException,
  MissingTokenException,
} from '../exceptions';

/** Estrategias */
import { JwtStrategy } from './jwt.strategy';

type ConfigServiceMock = Pick<ConfigService, 'get'>;
type ValidateAccessTokenUseCaseMock = Pick<ValidateAccessTokenUseCase, 'run'>;

describe('JwtStrategy', () => {
  let configServiceMock: jest.Mocked<ConfigServiceMock>;
  let validateAccessTokenUseCaseMock: jest.Mocked<ValidateAccessTokenUseCaseMock>;
  let strategy: JwtStrategy;

  beforeEach(() => {
    configServiceMock = {
      get: jest.fn().mockReturnValue('test-secret'),
    };
    validateAccessTokenUseCaseMock = {
      run: jest.fn(),
    };

    strategy = new JwtStrategy(
      configServiceMock as unknown as ConfigService,
      validateAccessTokenUseCaseMock as unknown as ValidateAccessTokenUseCase,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const createContext = (authorization?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    }) as ExecutionContext;

  it('deberia lanzar MissingTokenException cuando no existe Authorization', () => {
    // Arrange
    const context = createContext();

    // Act
    const result = () => strategy.handleRequest(null, {}, null, context);

    // Assert
    expect(result).toThrow(MissingTokenException);
  });

  it('deberia lanzar ExpiredTokenException cuando el token expiro', () => {
    // Arrange
    const context = createContext('Bearer expired-token');
    const expirationError = new TokenExpiredError('jwt expired', new Date());

    // Act
    const result = () =>
      strategy.handleRequest(null, {}, expirationError, context);

    // Assert
    expect(result).toThrow(ExpiredTokenException);
  });

  it('deberia lanzar MalformedTokenException cuando Passport informa un error', () => {
    // Arrange
    const context = createContext('Bearer malformed-token');

    // Act
    const result = () =>
      strategy.handleRequest(new Error('invalid token'), false, null, context);

    // Assert
    expect(result).toThrow(MalformedTokenException);
  });

  it('deberia devolver el usuario cuando el token es valido', () => {
    // Arrange
    const context = createContext('Bearer valid-token');
    const user = { accountId: 'account-id' };

    // Act
    const result = strategy.handleRequest(null, user, null, context);

    // Assert
    expect(result).toBe(user);
  });

  it('deberia delegar la validacion del payload al caso de uso', async () => {
    // Arrange
    const payload = {
      accountId: 'account-id',
      roleId: 'role-id',
      profileId: 'profile-id',
      permissions: [],
    };
    const runMock = jest.spyOn(validateAccessTokenUseCaseMock, 'run');
    runMock.mockResolvedValue(payload);

    // Act
    const result = await strategy.validate(payload);

    // Assert
    expect(result).toBe(payload);
    expect(runMock.mock.calls).toContainEqual([payload]);
  });
});
