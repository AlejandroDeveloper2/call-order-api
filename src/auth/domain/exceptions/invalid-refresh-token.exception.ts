import { DomainException } from '../../../shared/domain/exceptions';

export class InvalidRefreshTokenException extends DomainException {
  readonly code = 'INVALID_REFRESH_TOKEN';

  constructor(message: string) {
    super(message);
  }
}
