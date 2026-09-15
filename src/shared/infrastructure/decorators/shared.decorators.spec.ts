import 'reflect-metadata';

import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';

jest.mock('@nestjs/platform-express', () => ({
  FileInterceptor: jest.fn(() => class FileInterceptorMock {}),
}));

jest.mock('../interceptors', () => ({
  CloudinaryUploadInterceptor: class CloudinaryUploadInterceptorMock {},
}));

import { FileInterceptor } from '@nestjs/platform-express';

import { API_MESSAGE_KEY, ApiMessage, ImageUrl, UploadImage } from './index';
import { ValidationException } from '../exceptions';

type FileInterceptorOptions = {
  fileFilter: (
    request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, accepted: boolean) => void,
  ) => void;
};

const getLastFileInterceptorOptions = (): FileInterceptorOptions => {
  const calls = (FileInterceptor as jest.Mock).mock.calls as unknown as [
    string,
    FileInterceptorOptions,
  ][];

  return calls[calls.length - 1][1];
};

const invokeImageUrl = (request: Record<string, unknown>) => {
  class TestController {
    method() {}
  }

  const decorator = ImageUrl(undefined);
  decorator(TestController.prototype, 'method', 0);

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

  return factory(undefined, context);
};

describe('Decoradores shared', () => {
  describe('ApiMessage', () => {
    it('deberia guardar el mensaje en la metadata del handler', () => {
      // Arrange
      class TestController {
        method() {}
      }
      const message = 'Operacion exitosa';
      const descriptor = Object.getOwnPropertyDescriptor(
        TestController.prototype,
        'method',
      )!;

      // Act
      ApiMessage(message)(TestController.prototype, 'method', descriptor);

      // Assert
      expect(
        Reflect.getMetadata(API_MESSAGE_KEY, descriptor.value as object),
      ).toBe(message);
    });
  });

  describe('ImageUrl', () => {
    it('deberia devolver la URL del archivo almacenada en la solicitud', () => {
      // Arrange
      const request = { fileUrl: 'https://image.test/avatar.png' };

      // Act
      const result = invokeImageUrl(request);

      // Assert
      expect(result).toBe('https://image.test/avatar.png');
    });

    it('deberia devolver undefined cuando la solicitud no tiene URL', () => {
      // Arrange
      const request = {};

      // Act
      const result = invokeImageUrl(request);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('UploadImage', () => {
    it('deberia configurar el campo y los interceptores por defecto', () => {
      // Arrange
      class TestController {
        method() {}
      }
      const descriptor = Object.getOwnPropertyDescriptor(
        TestController.prototype,
        'method',
      )!;
      const handler = descriptor.value as object;

      // Act
      UploadImage()(TestController.prototype, 'method', descriptor);

      // Assert
      expect(FileInterceptor).toHaveBeenCalledWith('file', expect.any(Object));
      expect(Reflect.getMetadata(INTERCEPTORS_METADATA, handler)).toHaveLength(
        2,
      );
    });

    it('deberia configurar un nombre de campo personalizado', () => {
      // Arrange
      class TestController {
        method() {}
      }
      const descriptor = Object.getOwnPropertyDescriptor(
        TestController.prototype,
        'method',
      )!;

      // Act
      UploadImage('avatar')(TestController.prototype, 'method', descriptor);

      // Assert
      expect(FileInterceptor).toHaveBeenCalledWith(
        'avatar',
        expect.any(Object),
      );
    });

    it('deberia aceptar formatos de imagen permitidos', () => {
      // Arrange
      class TestController {
        method() {}
      }
      const descriptor = Object.getOwnPropertyDescriptor(
        TestController.prototype,
        'method',
      )!;
      UploadImage()(TestController.prototype, 'method', descriptor);
      const options = getLastFileInterceptorOptions();
      const callback = jest.fn();

      // Act
      options.fileFilter({}, { mimetype: 'image/png' }, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('deberia rechazar formatos que no sean imagen', () => {
      // Arrange
      class TestController {
        method() {}
      }
      const descriptor = Object.getOwnPropertyDescriptor(
        TestController.prototype,
        'method',
      )!;
      UploadImage()(TestController.prototype, 'method', descriptor);
      const options = getLastFileInterceptorOptions();
      const callback = jest.fn();

      // Act
      options.fileFilter({}, { mimetype: 'application/pdf' }, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(
        expect.any(ValidationException),
        false,
      );
    });
  });
});
