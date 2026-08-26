import { DomainException } from '../../../shared/domain/exceptions';

export class InvalidEmailException extends DomainException {
  readonly code = 'INVALID_EMAIL';

  constructor(message: string) {
    super(message);
  }
}
