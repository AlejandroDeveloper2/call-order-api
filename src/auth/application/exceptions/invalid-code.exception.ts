import { ApplicationException } from '../../../shared/application/exceptions';

export class InvalidCodeException extends ApplicationException {
  readonly code = 'INVALID_CODE';

  constructor(message: string) {
    super(message);
  }
}
