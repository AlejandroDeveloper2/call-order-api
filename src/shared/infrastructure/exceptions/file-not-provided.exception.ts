import { InfrastructureException } from './infrastructure.exception';

export class FileNotProvidedException extends InfrastructureException {
  readonly code = 'FILE_NOT_PROVIDED';

  constructor(message: string) {
    super(message);
  }
}
