import { DomainException } from '../../../shared/domain/exceptions';

export class InvalidFullnameException extends DomainException {
  readonly code = 'INVALID_FULLNAME_FORMAT';

  constructor(message: string) {
    super(message);
  }
}
