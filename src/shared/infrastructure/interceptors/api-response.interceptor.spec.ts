import { ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';

import { API_MESSAGE_KEY } from '../decorators';
import { ApiResponseInterceptor } from './api-response.interceptor';

describe('ApiResponseInterceptor', () => {
  const createContext = (statusCode: number) => {
    const reflector = {
      get: jest.fn(),
    };
    const context = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getResponse: () => ({ statusCode }),
      }),
    };

    return {
      context: context as unknown as ExecutionContext,
      reflector,
    };
  };

  it('deberia envolver la respuesta con el mensaje definido', async () => {
    // Arrange
    const { context, reflector } = createContext(201);
    reflector.get.mockReturnValue('Registro creado');
    const interceptor = new ApiResponseInterceptor(reflector as never);
    const next = { handle: () => of({ id: 'record-id' }) };

    // Act
    const result = await firstValueFrom(
      interceptor.intercept(context, next as never),
    );

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
    const interceptor = new ApiResponseInterceptor(reflector as never);
    const next = { handle: () => of('ok') };

    // Act
    const result = await firstValueFrom(
      interceptor.intercept(context, next as never),
    );

    // Assert
    expect(result).toEqual({ data: 'ok', message: 'Success', httpCode: 200 });
  });
});
