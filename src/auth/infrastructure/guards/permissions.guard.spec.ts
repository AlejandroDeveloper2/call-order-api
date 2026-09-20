import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  InsufficientPermissionsException,
  NotAuthenticatedException,
} from '../exceptions';

import { PermissionsGuard } from './permissions.guard';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

type ReflectorMock = jest.Mocked<
  Pick<Reflector, 'get' | 'getAll' | 'getAllAndOverride' | 'getAllAndMerge'>
>;
type ExecutionContextMock = jest.Mocked<
  Pick<ExecutionContext, 'getHandler' | 'getClass' | 'switchToHttp'>
>;
type HttpArgumentsHostMock = jest.Mocked<HttpArgumentsHost>;

describe('PermissionsGuard', () => {
  let reflectorMock: jest.Mocked<ReflectorMock>;
  let executionContextMock: jest.Mocked<ExecutionContextMock>;
  let httpArgumentsHostMock: jest.Mocked<HttpArgumentsHostMock>;

  beforeEach(() => {
    reflectorMock = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndOverride: jest.fn(),
      getAllAndMerge: jest.fn(),
    };
    httpArgumentsHostMock = {
      getRequest: jest.fn(),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    };
    executionContextMock = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(httpArgumentsHostMock),
    };
  });

  const createContext = (user?: {
    permissions?: string[];
  }): ExecutionContext => {
    httpArgumentsHostMock.getRequest.mockReturnValue({ user });
    executionContextMock.switchToHttp.mockReturnValue(httpArgumentsHostMock);

    return executionContextMock as unknown as ExecutionContext;
  };

  const createReflector = (permissions?: string[]): Reflector => {
    reflectorMock.getAllAndOverride.mockReturnValue(permissions);

    return reflectorMock;
  };

  it('deberia permitir el acceso cuando no hay permisos requeridos', () => {
    // Arrange
    const reflector = createReflector();

    const guard = new PermissionsGuard(reflector);

    // Act
    const result = guard.canActivate(createContext());

    // Assert
    expect(result).toBe(true);
  });

  it('deberia lanzar NotAuthenticatedException cuando no hay usuario autenticado', () => {
    // Arrange
    const reflector = createReflector(['auth:read']);
    const guard = new PermissionsGuard(reflector);

    // Act
    const result = () => guard.canActivate(createContext());

    // Assert
    expect(result).toThrow(NotAuthenticatedException);
  });

  it('deberia permitir el acceso cuando el usuario tiene todos los permisos', () => {
    // Arrange
    const reflector = createReflector(['auth:read']);
    const guard = new PermissionsGuard(reflector);

    // Act
    const result = guard.canActivate(
      createContext({ permissions: ['auth:read', 'auth:update'] }),
    );

    // Assert
    expect(result).toBe(true);
  });

  it('deberia lanzar InsufficientPermissionsException cuando falta un permiso', () => {
    // Arrange
    const reflector = createReflector(['auth:read', 'auth:update']);
    const guard = new PermissionsGuard(reflector);

    // Act
    const result = () =>
      guard.canActivate(createContext({ permissions: ['auth:read'] }));

    // Assert
    expect(result).toThrow(InsufficientPermissionsException);
  });

  it('deberia tratar un usuario sin permisos como un usuario sin autorizaciones', () => {
    // Arrange
    const reflector = createReflector(['auth:read']);
    const guard = new PermissionsGuard(reflector);

    // Act
    const result = () => guard.canActivate(createContext({}));

    // Assert
    expect(result).toThrow(InsufficientPermissionsException);
  });
});
