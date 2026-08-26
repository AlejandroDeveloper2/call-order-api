import { ApplicationException } from '../../../shared/application/exceptions';

export class InvalidSessionException extends ApplicationException {
  readonly code = 'INVALID_SESSION';

  constructor(message: string) {
    super(message);
  }
}
