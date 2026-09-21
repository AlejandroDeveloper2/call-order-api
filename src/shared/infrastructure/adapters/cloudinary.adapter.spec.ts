import { v2 as cloudinary } from 'cloudinary';
import { createReadStream } from 'streamifier';

import { FileUploadException } from '../exceptions';

import { CloudinaryAdpater } from './cloudinary.adapter';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: jest.fn() },
  },
}));
jest.mock('streamifier', () => ({
  createReadStream: jest.fn(),
}));

type UploadStreamCallback = (
  error: Error | null,
  result?: Record<string, unknown>,
) => void;

type UploadStreamMock = jest.MockedFunction<
  (options: { folder: string }, callback: UploadStreamCallback) => unknown
>;

type CloudinaryMock = {
  config: jest.MockedFunction<typeof cloudinary.config>;
  uploader: {
    upload_stream: UploadStreamMock;
  };
};

describe('CloudinaryAdpater', () => {
  let cloudinaryMock: CloudinaryMock;
  let createReadStreamMock: jest.MockedFunction<typeof createReadStream>;

  const uploadResult = { secure_url: 'https://image.test/file.png' };

  beforeEach(() => {
    cloudinaryMock = {
      config: jest.fn() as jest.MockedFunction<typeof cloudinary.config>,
      uploader: {
        upload_stream: jest.fn() as UploadStreamMock,
      },
    };

    cloudinary.config = cloudinaryMock.config;
    cloudinary.uploader =
      cloudinaryMock.uploader as unknown as typeof cloudinary.uploader;
    createReadStreamMock = jest.fn() as jest.MockedFunction<
      typeof createReadStream
    >;

    (createReadStream as jest.MockedFunction<typeof createReadStream>) =
      createReadStreamMock;

    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'cloud-name';
    process.env.CLOUDINARY_API_KEY = 'api-key';
    process.env.CLOUDINARY_API_SECRET = 'api-secret';
  });

  it('deberia configurar Cloudinary al construirse', () => {
    // Arrange
    new CloudinaryAdpater();

    // Act
    const config = cloudinaryMock.config.mock.calls[0][0];

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
    createReadStreamMock.mockReturnValue(
      stream as unknown as ReturnType<typeof createReadStream>,
    );

    cloudinaryMock.uploader.upload_stream.mockImplementation(
      (options: { folder: string }, callback: UploadStreamCallback) => {
        expect(options).toEqual({ folder: 'documents' });
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
    createReadStreamMock.mockReturnValue(
      stream as unknown as ReturnType<typeof createReadStream>,
    );
    cloudinaryMock.uploader.upload_stream.mockImplementation(
      (options: { folder: string }, callback: UploadStreamCallback) => {
        expect(options).toEqual({ folder: 'avatars' });
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
    createReadStreamMock.mockReturnValue(
      stream as unknown as ReturnType<typeof createReadStream>,
    );
    cloudinaryMock.uploader.upload_stream.mockImplementation(
      (options: { folder: string }, callback: UploadStreamCallback) => {
        expect(options).toEqual({ folder: 'avatars' });
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
