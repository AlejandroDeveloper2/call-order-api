/* eslint-disable @typescript-eslint/unbound-method */
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { of } from 'rxjs';
import { UploadApiResponse } from 'cloudinary';

import { CloudinaryAdpater } from '../adapters/cloudinary.adapter';

import { FileNotProvidedException, FileUploadException } from '../exceptions';

import { CloudinaryUploadInterceptor } from './cloudinary-upload.interceptor';

type CloudinaryAdapterMock = jest.Mocked<Pick<CloudinaryAdpater, 'uploadFile'>>;
type CallHandlerMock = jest.Mocked<Pick<CallHandler, 'handle'>>;
type ExecutionContextMock = jest.Mocked<Pick<ExecutionContext, 'switchToHttp'>>;
type HttpArgumentsHostMock = jest.Mocked<Pick<HttpArgumentsHost, 'getRequest'>>;

describe('CloudinaryUploadInterceptor', () => {
  let cloudinaryAdapterMock: CloudinaryAdapterMock;
  let callHandlerMock: CallHandlerMock;
  let executionContextMock: ExecutionContextMock;
  let httpArgumentsHostMock: HttpArgumentsHostMock;

  beforeEach(() => {
    cloudinaryAdapterMock = {
      uploadFile: jest.fn(),
    };
    callHandlerMock = {
      handle: jest.fn(),
    };
    httpArgumentsHostMock = {
      getRequest: jest.fn(),
    };
    executionContextMock = {
      switchToHttp: jest.fn().mockReturnValue(httpArgumentsHostMock),
    };

    jest.clearAllMocks();
  });

  const createContext = (file?: Express.Multer.File) => {
    const request: { file?: Express.Multer.File; fileUrl?: string } = { file };
    httpArgumentsHostMock.getRequest.mockReturnValue(request);
    executionContextMock.switchToHttp.mockReturnValue(
      httpArgumentsHostMock as unknown as HttpArgumentsHost,
    );

    return {
      context: executionContextMock as unknown as ExecutionContext,
      request,
    };
  };

  it('deberia lanzar FileNotProvidedException cuando no existe archivo', async () => {
    // Arrange
    const { context } = createContext();
    const interceptor = new CloudinaryUploadInterceptor(cloudinaryAdapterMock);

    // Act
    const result = interceptor.intercept(context, callHandlerMock);

    // Assert
    await expect(result).rejects.toThrow(FileNotProvidedException);
    expect(cloudinaryAdapterMock.uploadFile).not.toHaveBeenCalled();
  });

  it('deberia asignar la URL y continuar cuando la carga es exitosa', async () => {
    // Arrange
    const file = { originalname: 'avatar.png' } as Express.Multer.File;
    const { context, request } = createContext(file);
    cloudinaryAdapterMock.uploadFile.mockResolvedValue({
      secure_url: 'https://image.test/avatar.png',
    } as UploadApiResponse);
    const observable = of('ok');
    const next: CallHandler = {
      handle: callHandlerMock.handle.mockReturnValue(observable),
    };
    const interceptor = new CloudinaryUploadInterceptor(cloudinaryAdapterMock);

    // Act
    const result = await interceptor.intercept(context, next);

    // Assert
    expect(cloudinaryAdapterMock.uploadFile).toHaveBeenCalledWith(file);
    expect(request.file).toBe(file);
    expect(request.fileUrl).toBe('https://image.test/avatar.png');
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(result).toBe(observable);
  });

  it('deberia traducir un error del adaptador a FileUploadException', async () => {
    // Arrange
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const file = { originalname: 'avatar.png' } as Express.Multer.File;
    const { context } = createContext(file);
    cloudinaryAdapterMock.uploadFile.mockRejectedValue(
      new Error('Cloudinary unavailable'),
    );
    const interceptor = new CloudinaryUploadInterceptor(cloudinaryAdapterMock);

    // Act
    const result = interceptor.intercept(context, callHandlerMock);

    // Assert
    await expect(result).rejects.toThrow(FileUploadException);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
