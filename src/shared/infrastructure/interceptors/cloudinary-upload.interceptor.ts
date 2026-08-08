import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UploadApiResponse } from 'cloudinary';

/** Excepciones de dominio */
import { AppError, SHARED_ERROR_CODES } from '../../domain/exceptions';

/** Adpatadores */
import { CloudinaryAdpater } from '../adapters';

interface RequestWithFile extends Express.Request {
  file: Express.Multer.File;
  fileUrl?: string;
}

@Injectable()
export class CloudinaryUploadInterceptor<T = any> implements NestInterceptor<
  T,
  any
> {
  constructor(private readonly cloudinaryAdapter: CloudinaryAdpater) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Promise<Observable<T>> {
    const request = context.switchToHttp().getRequest<RequestWithFile>();
    const file = request.file;

    if (!file)
      throw new AppError(
        SHARED_ERROR_CODES.fileNotProvided,
        400,
        'No se ha proporcionado ningun archivo',
        true,
      );

    try {
      const result: UploadApiResponse =
        await this.cloudinaryAdapter.uploadFile(file);

      request.fileUrl = result.secure_url;
    } catch (error: unknown) {
      console.error(error);
      throw new AppError(
        SHARED_ERROR_CODES.imageUploadError,
        400,
        'Error al subir el archivo a Cloudinary',
        true,
      );
    }

    return next.handle();
  }
}
