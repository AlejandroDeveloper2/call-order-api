import { ApplicationException } from '../../../shared/application/exceptions';

export class AccountLockedException extends ApplicationException {
  readonly code = 'ACCOUNT_LOCKED';

  constructor(message: string) {
    super(message);
  }
}
