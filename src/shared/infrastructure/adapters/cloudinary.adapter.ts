import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { createReadStream } from 'streamifier';

/** Puertos */
import { FileUploaderPort } from '../../domain/ports';

/** Excepciones de infraestructura */
import { ImageUploadErrorException } from '../exceptions';

@Injectable()
export class CloudinaryAdpater implements FileUploaderPort<
  Express.Multer.File,
  UploadApiResponse
> {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'avatars',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error)
            return reject(new ImageUploadErrorException(error.message));
          resolve(result as UploadApiResponse);
        },
      );
      createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
