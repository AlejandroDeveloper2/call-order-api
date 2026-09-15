import 'reflect-metadata';

import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { BearerToken, Cookie, GetAccount } from './index';
import {
  MalformedTokenException,
  MissingRefreshTokenException,
  MissingTokenException,
  NotAuthenticatedException,
} from '../exceptions';

const invokeDecorator = (
  decorator: unknown,
  data: unknown,
  request: Record<string, unknown>,
) => {
  class TestController {
    method() {}
  }

  const parameterDecoratorFactory = decorator as (
    value: unknown,
  ) => ParameterDecorator;
  const parameterDecorator = parameterDecoratorFactory(data);
  parameterDecorator(TestController.prototype, 'method', 0);

  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'method',
  ) as Record<
    string,
    { factory: (value: unknown, context: ExecutionContext) => unknown }
  >;
  const factory = Object.values(metadata)[0].factory;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;

  return factory(data, context);
};

describe('Decoradores HTTP de autenticacion', () => {
  describe('BearerToken', () => {
    it('deberia devolver el token de un header Bearer valido', () => {
      // Arrange
      const request = { headers: { authorization: 'Bearer access-token' } };

      // Act
      const result = invokeDecorator(BearerToken, undefined, request);

      // Assert
      expect(result).toBe('access-token');
    });

    it('deberia lanzar MissingTokenException si no existe Authorization', () => {
      // Arrange
      const request = { headers: {} };

      // Act
      const result = () => invokeDecorator(BearerToken, undefined, request);

      // Assert
      expect(result).toThrow(MissingTokenException);
    });

    it('deberia lanzar MalformedTokenException si el esquema no es Bearer', () => {
      // Arrange
      const request = { headers: { authorization: 'Basic access-token' } };

      // Act
      const result = () => invokeDecorator(BearerToken, undefined, request);

      // Assert
      expect(result).toThrow(MalformedTokenException);
    });
  });

  describe('Cookie', () => {
    it('deberia devolver la cookie solicitada', () => {
      // Arrange
      const request = { cookies: { refresh_token: 'refresh-token' } };

      // Act
      const result = invokeDecorator(Cookie, 'refresh_token', request);

      // Assert
      expect(result).toBe('refresh-token');
    });

    it('deberia lanzar MissingRefreshTokenException si la cookie no existe', () => {
      // Arrange
      const request = { cookies: {} };

      // Act
      const result = () => invokeDecorator(Cookie, 'refresh_token', request);

      // Assert
      expect(result).toThrow(MissingRefreshTokenException);
    });
  });

  describe('GetAccount', () => {
    it('deberia devolver el usuario completo cuando no se solicita una propiedad', () => {
      // Arrange
      const user = { accountId: 'account-id', roleId: 'role-id' };

      // Act
      const result = invokeDecorator(GetAccount, undefined, { user });

      // Assert
      expect(result).toBe(user);
    });

    it('deberia devolver la propiedad solicitada del usuario', () => {
      // Arrange
      const request = { user: { accountId: 'account-id' } };

      // Act
      const result = invokeDecorator(GetAccount, 'accountId', request);

      // Assert
      expect(result).toBe('account-id');
    });

    it('deberia lanzar NotAuthenticatedException si no existe el usuario', () => {
      // Arrange
      const request = {};

      // Act
      const result = () => invokeDecorator(GetAccount, 'accountId', request);

      // Assert
      expect(result).toThrow(NotAuthenticatedException);
    });
  });
});
