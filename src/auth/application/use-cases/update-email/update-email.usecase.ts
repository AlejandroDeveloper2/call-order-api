/** Puertos */
import { AccountRepositoryPort } from '../../../domain/ports';

/** Value Objects */
import { Email } from '../../../domain/value-objects';

/** Excepciones */
import { AccountNotFoundException } from '../../exceptions';

/** Commands */
import { UpdateEmailCommand } from '../../commands';

export class UpdateEmailUseCase {
  constructor(private readonly accountRepository: AccountRepositoryPort) {}

  async run(
    accountId: string,
    updateEmailCommand: UpdateEmailCommand,
  ): Promise<void> {
    const { updatedEmail } = updateEmailCommand;

    const updatedEmailValue = Email.create(updatedEmail).toString();

    const affectedRows = await this.accountRepository.updateEmail(
      accountId,
      updatedEmailValue,
    );

    if (affectedRows === 0)
      throw new AccountNotFoundException('Cuenta no encontrada');
  }
}
