import { ApplicationException } from '../../../shared/application/exceptions';

export class AccountNotFoundException extends ApplicationException {
  readonly code = 'ACCOUNT_NOT_FOUND';

  constructor(message: string) {
    super(message);
  }
}
