import { InfrastructureException } from '../../../shared/infrastructure/exceptions';

export class MissingRefreshTokenException extends InfrastructureException {
  readonly code = 'MISSING_REFRESH_TOKEN';

  constructor(message: string) {
    super(message);
  }
}
