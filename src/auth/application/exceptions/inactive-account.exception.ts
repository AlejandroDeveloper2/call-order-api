import { ApplicationException } from '../../../shared/application/exceptions';

export class InactiveAccountException extends ApplicationException {
  readonly code = 'INACTIVE_ACCOUNT';

  constructor(message: string) {
    super(message);
  }
}
