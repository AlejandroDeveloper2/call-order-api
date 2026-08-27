import { DomainException } from '.';

export class InvalidPhoneException extends DomainException {
  readonly code = 'INVALID_PHONE_FORMAT';

  constructor(message: string) {
    super(message);
  }
}
