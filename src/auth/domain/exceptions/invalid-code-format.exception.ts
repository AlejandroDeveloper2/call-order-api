import { DomainException } from '../../../shared/domain/exceptions';

export class InvalidCodeFormatException extends DomainException {
  readonly code = 'INVALID_CODE_FORMAT';

  constructor(message: string) {
    super(message);
  }
}
