import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/** Errores de dominio */
import { AppError, SHARED_ERROR_CODES } from '../../domain/exceptions';

/** Interceptadores */
import { CloudinaryUploadInterceptor } from '../interceptors';

const multerOptions: MulterOptions = {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      return cb(
        new AppError(
          SHARED_ERROR_CODES.validationError,
          400,
          'Solo se permiten imágenes',
          true,
        ),
        false,
      );
    }
    cb(null, true);
  },
};

export function UploadAvatar(fieldName = 'file') {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, multerOptions)),
    UseInterceptors(CloudinaryUploadInterceptor),
  );
}
