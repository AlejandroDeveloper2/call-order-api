import { DomainException } from '../../../shared/domain/exceptions';

export class InvalidTokenException extends DomainException {
  readonly code = 'INVALID_TOKEN';

  constructor(message: string) {
    super(message);
  }
}
