import { ExecutionContext } from '@nestjs/common';

import { MalformedTokenException, MissingTokenException } from '../exceptions';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const createContext = (authorization?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    }) as ExecutionContext;

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
});
