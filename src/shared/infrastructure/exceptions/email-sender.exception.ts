import { InfrastructureException } from './infrastructure.exception';

export class EmailSenderException extends InfrastructureException {
  readonly code = 'EMAIL_SENDING_ERROR';

  constructor(message = 'Operación de   envio de correo electrónico fallida') {
    super(message);
  }
}
