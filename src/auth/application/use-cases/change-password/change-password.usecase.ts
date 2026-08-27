/** Puertos */
import {
  AccountRepositoryPort,
  type EncryptorPort,
} from '../../../domain/ports';

/** Value Objects */
import { Password } from '../../../domain/value-objects';

/** Excepciones */
import {
  AccountNotFoundException,
  IncorrectPasswordException,
} from '../../exceptions';

/** Dtos */
import { ChangePasswordCommand } from '../../commands';

export class ChangePasswordUseCase {
  constructor(
    private readonly accountRepository: AccountRepositoryPort,
    private readonly encryptor: EncryptorPort,
  ) {}

  async run(
    accountId: string,
    changePasswordCommand: ChangePasswordCommand,
  ): Promise<void> {
    /** Creamos los value objects para validación de las reglas de dominio */
    const currentPassword = Password.create(
      changePasswordCommand.currentPassword,
    );
    const newPassword = Password.create(changePasswordCommand.newPassword);

    /** Obtenemos la cuenta por ID */
    const account =
      await this.accountRepository.findForUpdatingPassword(accountId);

    if (!account) throw new AccountNotFoundException('Cuenta no encontrada');

    /** Validar si la contraseña actual coincide con la almacenada en db */
    const isCorrectPassword = await this.encryptor.compare(
      currentPassword.toString(),
      account.passwordHash,
    );

    if (!isCorrectPassword)
      throw new IncorrectPasswordException('Contraseña actual incorrecta');

    /** Encriptamos la nueva contraseña  y la actualizamos */
    const newPasswordHash = await this.encryptor.hash(
      newPassword.toString(),
      14,
    );

    /** Actualizamos la contraseña */
    await this.accountRepository.updatePassword(accountId, newPasswordHash);
  }
}
