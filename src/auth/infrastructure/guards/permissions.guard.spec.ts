import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  InsufficientPermissionsException,
  NotAuthenticatedException,
} from '../exceptions';

import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const createContext = (user?: { permissions?: string[] }) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const createReflector = (permissions?: string[]) =>
    ({
      getAllAndOverride: jest.fn().mockReturnValue(permissions),
    }) as unknown as Reflector;

  it('deberia permitir el acceso cuando no hay permisos requeridos', () => {
    // Arrange
    const guard = new PermissionsGuard(createReflector());

    // Act
    const result = guard.canActivate(createContext());

    // Assert
    expect(result).toBe(true);
  });

  it('deberia lanzar NotAuthenticatedException cuando no hay usuario autenticado', () => {
    // Arrange
    const guard = new PermissionsGuard(createReflector(['auth:read']));

    // Act
    const result = () => guard.canActivate(createContext());

    // Assert
    expect(result).toThrow(NotAuthenticatedException);
  });

  it('deberia permitir el acceso cuando el usuario tiene todos los permisos', () => {
    // Arrange
    const guard = new PermissionsGuard(createReflector(['auth:read']));

    // Act
    const result = guard.canActivate(
      createContext({ permissions: ['auth:read', 'auth:update'] }),
    );

    // Assert
    expect(result).toBe(true);
  });

  it('deberia lanzar InsufficientPermissionsException cuando falta un permiso', () => {
    // Arrange
    const guard = new PermissionsGuard(
      createReflector(['auth:read', 'auth:update']),
    );

    // Act
    const result = () =>
      guard.canActivate(createContext({ permissions: ['auth:read'] }));

    // Assert
    expect(result).toThrow(InsufficientPermissionsException);
  });

  it('deberia tratar un usuario sin permisos como un usuario sin autorizaciones', () => {
    // Arrange
    const guard = new PermissionsGuard(createReflector(['auth:read']));

    // Act
    const result = () => guard.canActivate(createContext({}));

    // Assert
    expect(result).toThrow(InsufficientPermissionsException);
  });
});
