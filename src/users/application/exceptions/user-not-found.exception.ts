import { ApplicationException } from '../../../shared/application/exceptions';

export class UserNotFoundException extends ApplicationException {
  readonly code = 'USER_NOT_FOUND';

  constructor(message: string) {
    super(message);
  }
}
