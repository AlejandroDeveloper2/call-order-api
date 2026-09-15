jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: jest.fn() },
  },
}));
jest.mock('streamifier', () => ({
  createReadStream: jest.fn(),
}));

import { v2 as cloudinary } from 'cloudinary';
import { createReadStream } from 'streamifier';

import { FileUploadException } from '../exceptions';

import { CloudinaryAdpater } from './cloudinary.adapter';

describe('CloudinaryAdpater', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'cloud-name';
    process.env.CLOUDINARY_API_KEY = 'api-key';
    process.env.CLOUDINARY_API_SECRET = 'api-secret';
  });

  it('deberia configurar Cloudinary al construirse', () => {
    // Arrange
    new CloudinaryAdpater();

    // Act
    const config = (
      (cloudinary.config as jest.Mock).mock.calls as unknown as [
        Record<string, string>,
      ][]
    )[0][0];

    // Assert
    expect(config).toEqual({
      cloud_name: 'cloud-name',
      api_key: 'api-key',
      api_secret: 'api-secret',
    });
  });

  it('deberia subir el archivo en la carpeta indicada y resolver el resultado', async () => {
    // Arrange
    const stream = { pipe: jest.fn() };
    const uploadResult = { secure_url: 'https://image.test/file.png' };
    (createReadStream as jest.Mock).mockReturnValue(stream);
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (_options: unknown, callback: (error: null, result: object) => void) => {
        callback(null, uploadResult);
        return { upload: jest.fn() };
      },
    );
    const adapter = new CloudinaryAdpater();
    const file = { buffer: Buffer.from('file') } as Express.Multer.File;

    // Act
    const result = await adapter.uploadFile(file, 'documents');

    // Assert
    expect(result).toBe(uploadResult);
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      { folder: 'documents' },
      expect.any(Function),
    );
    expect(createReadStream).toHaveBeenCalledWith(file.buffer);
    expect(stream.pipe).toHaveBeenCalled();
  });

  it('deberia usar avatars como carpeta por defecto', async () => {
    // Arrange
    const stream = { pipe: jest.fn() };
    (createReadStream as jest.Mock).mockReturnValue(stream);
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (_options: unknown, callback: (error: null, result: object) => void) => {
        callback(null, {});
        return {};
      },
    );
    const adapter = new CloudinaryAdpater();

    // Act
    await adapter.uploadFile({
      buffer: Buffer.from('file'),
    } as Express.Multer.File);

    // Assert
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      { folder: 'avatars' },
      expect.any(Function),
    );
  });

  it('deberia rechazar con FileUploadException cuando Cloudinary devuelve error', async () => {
    // Arrange
    const stream = { pipe: jest.fn() };
    (createReadStream as jest.Mock).mockReturnValue(stream);
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (
        _options: unknown,
        callback: (error: Error, result?: undefined) => void,
      ) => {
        callback(new Error('Cloudinary unavailable'));
        return {};
      },
    );
    const adapter = new CloudinaryAdpater();

    // Act
    const result = adapter.uploadFile({
      buffer: Buffer.from('file'),
    } as Express.Multer.File);

    // Assert
    await expect(result).rejects.toBeInstanceOf(FileUploadException);
    await expect(result).rejects.toThrow('Cloudinary unavailable');
  });
});
