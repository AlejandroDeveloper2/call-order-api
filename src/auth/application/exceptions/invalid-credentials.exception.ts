import { ApplicationException } from '../../../shared/application/exceptions';

export class InvalidCredentialsException extends ApplicationException {
  readonly code = 'INVALID_CREDENTIALS';

  constructor(message: string) {
    super(message);
  }
}
