import { ApplicationException } from '../../../shared/application/exceptions';

export class CodeNotExpiredYetException extends ApplicationException {
  readonly code = 'CODE_NOT_EXPIRED_YET';

  constructor(message: string) {
    super(message);
  }
}
