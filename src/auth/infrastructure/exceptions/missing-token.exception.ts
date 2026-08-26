import { InfrastructureException } from '../../../shared/infrastructure/exceptions';

export class MissingTokenException extends InfrastructureException {
  readonly code = 'MISSING_TOKEN';

  constructor(message: string) {
    super(message);
  }
}
