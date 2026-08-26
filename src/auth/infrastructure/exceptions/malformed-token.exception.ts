import { InfrastructureException } from '../../../shared/infrastructure/exceptions';

export class MalformedTokenException extends InfrastructureException {
  readonly code = 'MALFORMED_TOKEN';

  constructor(message: string) {
    super(message);
  }
}
