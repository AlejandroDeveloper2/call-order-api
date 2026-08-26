import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UploadApiResponse } from 'cloudinary';

/** Excepciones de dominio */
import { FileNotProvidedException, FileUploadException } from '../exceptions';

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
      throw new FileNotProvidedException(
        'No se ha proporcionado ningun archivo',
      );

    try {
      const result: UploadApiResponse =
        await this.cloudinaryAdapter.uploadFile(file);

      request.fileUrl = result.secure_url;
    } catch (error: unknown) {
      console.error(error);
      throw new FileUploadException('Error al subir el archivo a Cloudinary');
    }

    return next.handle();
  }
}
