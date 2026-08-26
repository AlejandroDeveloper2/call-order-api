/** Puertos */
import { AccountRepositoryPort, EncryptorPort } from '../../../domain/ports';

/** Value objects */
import { Password } from '../../../domain/value-objects';

/** Excepciones */
import { AccountNotFoundException } from '../../exceptions';

/** Commands */
import { UpdatePasswordCommand } from '../../commands';

export class UpdatePasswordUseCase {
  constructor(
    private readonly accountRepository: AccountRepositoryPort,
    private readonly encryptor: EncryptorPort,
  ) {}

  async run(
    accountId: string,
    updatePasswordCommand: UpdatePasswordCommand,
  ): Promise<void> {
    const { newPassword } = updatePasswordCommand;

    const newPasswordValue = Password.create(newPassword).toString();

    const passwordHash = await this.encryptor.hash(newPasswordValue, 14);

    const affectedRows = await this.accountRepository.updatePassword(
      accountId,
      passwordHash,
    );

    if (affectedRows === 0)
      throw new AccountNotFoundException('Cuenta no encontrada');
  }
}
