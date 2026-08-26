import { InfrastructureException } from './infrastructure.exception';

export class PersistenceException extends InfrastructureException {
  readonly code = 'PERSISTENCE_ERROR';

  constructor(message = 'Operación de base de datos fallida') {
    super(message);
  }
}
