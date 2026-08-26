import { InfrastructureException } from '../../../shared/infrastructure/exceptions';

export class InsufficientPermissionsException extends InfrastructureException {
  readonly code = 'INSUFFICIENT_PERMISSIONS';

  constructor(message: string) {
    super(message);
  }
}
