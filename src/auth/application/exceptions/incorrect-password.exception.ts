import { ApplicationException } from '../../../shared/application/exceptions';

export class IncorrectPasswordException extends ApplicationException {
  readonly code = 'INCORRECT_PASSWORD';

  constructor(message: string) {
    super(message);
  }
}
