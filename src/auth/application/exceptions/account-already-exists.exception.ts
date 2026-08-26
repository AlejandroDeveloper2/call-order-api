import { ApplicationException } from '../../../shared/application/exceptions';

export class AccountAlreadyExistsException extends ApplicationException {
  readonly code = 'ACCOUNT_ALREADY_EXISTS';

  constructor(message: string) {
    super(message);
  }
}
