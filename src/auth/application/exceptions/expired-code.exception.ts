import { ApplicationException } from '../../../shared/application/exceptions';

export class ExpiredCodeException extends ApplicationException {
  readonly code = 'EXPIRED_CODE';

  constructor(message: string) {
    super(message);
  }
}
