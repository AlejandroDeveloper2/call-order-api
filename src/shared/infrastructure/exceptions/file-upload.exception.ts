import { InfrastructureException } from './infrastructure.exception';

export class FileUploadException extends InfrastructureException {
  readonly code = 'FILE_UPLOAD_ERROR';

  constructor(message = 'Operación de subida de archivos fallida') {
    super(message);
  }
}
