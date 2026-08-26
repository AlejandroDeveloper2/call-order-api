import { DomainException } from '../../../shared/domain/exceptions';

export class InvalidPasswordException extends DomainException {
  readonly code = 'INVALID_PASSWORD';

  constructor(message: string) {
    super(message);
  }
}
