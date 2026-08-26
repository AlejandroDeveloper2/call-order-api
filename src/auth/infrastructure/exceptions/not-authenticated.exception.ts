import { InfrastructureException } from '../../../shared/infrastructure/exceptions';

export class NotAuthenticatedException extends InfrastructureException {
  readonly code = 'NOT_AUTHENTICATED';

  constructor(message: string) {
    super(message);
  }
}
