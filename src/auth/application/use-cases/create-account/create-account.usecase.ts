/** Entidades de dominio */
import { Account } from '../../../domain/entities';
import { User } from '../../../../users/domain/entities';

/** Value Objects */
import { Email, Password } from '../../../domain/value-objects';

/** Puertos */
import { AccountRepositoryPort, EncryptorPort } from '../../../domain/ports';
import { UserRepositoryPort } from '../../../../users/domain/ports';

import {
  IdGeneratorPort,
  TransactionManagerPort,
} from '../../../../shared/domain/ports';

/** Errores de dominio */
import { AccountAlreadyExistsException } from '../../exceptions';

/** Dtos */
import { CreateAccountCommand } from '../../commands';

export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly transactionManager: TransactionManagerPort,
    private readonly encryptor: EncryptorPort,
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async run(createAccountCommand: CreateAccountCommand): Promise<void> {
    const email = Email.create(createAccountCommand.email).toString();
    const password = Password.create(createAccountCommand.password).toString();

    /** Validar si existe otra cuenta asociada con el correo ingresado */
    const accountExists = await this.accountRepository.verifyByEmail(email);

    if (accountExists)
      throw new AccountAlreadyExistsException(
        'Ya existe una cuenta asociada con el correo ingresado',
      );

    /** Generar id único de cuenta y usuario */
    const accountId = this.idGenerator.generate();
    const userId = this.idGenerator.generate();

    /** Generar hash de contraseña */
    const passwordHash = await this.encryptor.hash(password, 14);

    /** Crear las instancias de dominio de la cuenta y el usuario */
    const user = User.create(
      userId,
      createAccountCommand.fullname,
      createAccountCommand.roleId,
      undefined,
      createAccountCommand.phone,
    );

    const account = Account.create(
      accountId,
      email,
      passwordHash,
      false,
      0,
      userId,
    );

    /** Crear cuenta y usuario en una transacción agnóstica */
    await this.transactionManager.run(async (context) => {
      await this.userRepository.create(user, context);
      await this.accountRepository.create(account, context);
    });
  }
}
