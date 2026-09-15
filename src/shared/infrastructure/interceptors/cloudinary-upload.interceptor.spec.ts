import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

import { FileNotProvidedException, FileUploadException } from '../exceptions';
import { CloudinaryUploadInterceptor } from './cloudinary-upload.interceptor';

describe('CloudinaryUploadInterceptor', () => {
  const createContext = (file?: Express.Multer.File) => {
    const request = { file };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    return { context: context as unknown as ExecutionContext, request };
  };

  it('deberia lanzar FileNotProvidedException cuando no existe archivo', async () => {
    // Arrange
    const { context } = createContext();
    const adapter = { uploadFile: jest.fn() };
    const interceptor = new CloudinaryUploadInterceptor(adapter as never);

    // Act
    const result = interceptor.intercept(context, {
      handle: jest.fn(),
    } as never);

    // Assert
    await expect(result).rejects.toThrow(FileNotProvidedException);
    expect(adapter.uploadFile).not.toHaveBeenCalled();
  });

  it('deberia asignar la URL y continuar cuando la carga es exitosa', async () => {
    // Arrange
    const file = { originalname: 'avatar.png' } as Express.Multer.File;
    const { context, request } = createContext(file);
    const adapter = {
      uploadFile: jest
        .fn()
        .mockResolvedValue({ secure_url: 'https://image.test/avatar.png' }),
    };
    const next = { handle: jest.fn().mockReturnValue(of('ok')) };
    const interceptor = new CloudinaryUploadInterceptor(adapter as never);

    // Act
    const result = await interceptor.intercept(context, next as never);

    // Assert
    expect(adapter.uploadFile).toHaveBeenCalledWith(file);
    expect(request.fileUrl).toBe('https://image.test/avatar.png');
    expect(result).toBe(next.handle());
  });

  it('deberia traducir un error del adaptador a FileUploadException', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation();
    const file = { originalname: 'avatar.png' } as Express.Multer.File;
    const { context } = createContext(file);
    const adapter = {
      uploadFile: jest
        .fn()
        .mockRejectedValue(new Error('Cloudinary unavailable')),
    };
    const interceptor = new CloudinaryUploadInterceptor(adapter as never);

    // Act
    const result = interceptor.intercept(context, {
      handle: jest.fn(),
    } as never);

    // Assert
    await expect(result).rejects.toThrow(FileUploadException);
    expect(console.error).toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});
