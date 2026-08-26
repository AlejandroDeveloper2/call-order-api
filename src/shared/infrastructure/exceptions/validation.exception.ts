import { InfrastructureException } from './infrastructure.exception';

export class ValidationException extends InfrastructureException {
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
  }
}
