import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { firstValueFrom, of } from 'rxjs';

import { API_MESSAGE_KEY } from '../decorators';

import { ApiResponseInterceptor } from './api-response.interceptor';

type ReflectorMock = jest.Mocked<Pick<Reflector, 'get'>>;
type ExecutionContextMock = jest.Mocked<
  Pick<ExecutionContext, 'getHandler' | 'switchToHttp'>
>;
type HttpArgumentsHostMock = jest.Mocked<
  Pick<HttpArgumentsHost, 'getResponse'>
>;

describe('ApiResponseInterceptor', () => {
  let reflectorMock: ReflectorMock;
  let executionContextMock: ExecutionContextMock;
  let httpArgumentsHostMock: HttpArgumentsHostMock;

  beforeEach(() => {
    reflectorMock = {
      get: jest.fn(),
    };
    httpArgumentsHostMock = {
      getResponse: jest.fn(),
    };
    executionContextMock = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(httpArgumentsHostMock),
    };
    jest.clearAllMocks();
  });

  const createContext = (statusCode: number) => {
    httpArgumentsHostMock.getResponse.mockReturnValue({ statusCode });
    executionContextMock.switchToHttp.mockReturnValue(
      httpArgumentsHostMock as unknown as HttpArgumentsHost,
    );

    return {
      context: executionContextMock as unknown as ExecutionContext,
      reflector: reflectorMock,
    };
  };

  it('deberia envolver la respuesta con el mensaje definido', async () => {
    // Arrange
    const { context, reflector } = createContext(201);
    reflector.get.mockReturnValue('Registro creado');
    const interceptor = new ApiResponseInterceptor(
      reflector as unknown as Reflector,
    );
    const next = { handle: () => of({ id: 'record-id' }) };

    // Act
    const result = await firstValueFrom(interceptor.intercept(context, next));

    // Assert
    expect(reflector.get).toHaveBeenCalledWith(API_MESSAGE_KEY, undefined);
    expect(result).toEqual({
      data: { id: 'record-id' },
      message: 'Registro creado',
      httpCode: 201,
    });
  });

  it('deberia utilizar Success cuando no existe un mensaje configurado', async () => {
    // Arrange
    const { context, reflector } = createContext(200);
    reflector.get.mockReturnValue(undefined);
    const interceptor = new ApiResponseInterceptor(
      reflector as unknown as Reflector,
    );
    const next = { handle: () => of('ok') };

    // Act
    const result = await firstValueFrom(interceptor.intercept(context, next));

    // Assert
    expect(result).toEqual({ data: 'ok', message: 'Success', httpCode: 200 });
  });
});
