import { ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { TokenExpiredError } from 'jsonwebtoken';

import {
  ExpiredTokenException,
  MalformedTokenException,
  MissingTokenException,
} from '../exceptions';

import { JwtAuthGuard } from './jwt-auth.guard';

type ExecutionContextMock = jest.Mocked<Pick<ExecutionContext, 'switchToHttp'>>;
type HttpArgumentsHostMock = jest.Mocked<Pick<HttpArgumentsHost, 'getRequest'>>;

describe('JwtAuthGuard', () => {
  let executionContextMock: ExecutionContextMock;
  let httpArgumentsHostMock: HttpArgumentsHostMock;

  beforeEach(() => {
    httpArgumentsHostMock = {
      getRequest: jest.fn(),
    };
    executionContextMock = {
      switchToHttp: jest.fn().mockReturnValue(httpArgumentsHostMock),
    };
    jest.clearAllMocks();
  });

  const createContext = (authorization?: string): ExecutionContext => {
    httpArgumentsHostMock.getRequest.mockReturnValue({
      headers: { authorization },
    });
    executionContextMock.switchToHttp.mockReturnValue(
      httpArgumentsHostMock as unknown as HttpArgumentsHost,
    );

    return executionContextMock as unknown as ExecutionContext;
  };

  it('deberia lanzar MissingTokenException cuando no se proporciona Authorization', () => {
    // Arrange
    const guard = new JwtAuthGuard();

    // Act
    const result = () => guard.canActivate(createContext());

    // Assert
    expect(result).toThrow(MissingTokenException);
  });

  it('deberia lanzar MalformedTokenException cuando el esquema no es Bearer', () => {
    // Arrange
    const guard = new JwtAuthGuard();

    // Act
    const result = () => guard.canActivate(createContext('Basic token'));

    // Assert
    expect(result).toThrow(MalformedTokenException);
  });

  it('deberia lanzar MalformedTokenException cuando Passport informa un token invalido', () => {
    // Arrange
    const guard = new JwtAuthGuard();
    const context = createContext('Bearer token-11111');

    // Act
    const result = () =>
      guard.handleRequest(null, false, new Error('jwt malformed'), context);

    // Assert
    expect(result).toThrow(MalformedTokenException);
  });

  it('deberia lanzar ExpiredTokenException cuando Passport informa un token expirado', () => {
    // Arrange
    const guard = new JwtAuthGuard();
    const context = createContext('Bearer expired-token');
    const expirationError = new TokenExpiredError('jwt expired', new Date());

    // Act
    const result = () =>
      guard.handleRequest(null, false, expirationError, context);

    // Assert
    expect(result).toThrow(ExpiredTokenException);
  });

  it('deberia propagar el error generado durante la validacion del payload', () => {
    // Arrange
    const guard = new JwtAuthGuard();
    const context = createContext('Bearer valid-token');
    const validationError = new Error('validation failed');

    // Act
    const result = () =>
      guard.handleRequest(validationError, false, null, context);

    // Assert
    expect(result).toThrow(validationError);
  });
});
