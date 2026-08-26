import { InfrastructureException } from '../../../shared/infrastructure/exceptions';

export class ExpiredTokenException extends InfrastructureException {
  readonly code = 'EXPIRED_TOKEN';

  constructor(message: string) {
    super(message);
  }
}
