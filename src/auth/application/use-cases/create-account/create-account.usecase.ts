/** Entidades de dominio */
import { Account } from '../../../domain/entities';
import { User } from '../../../../users/domain/entities';

/** Value Objects */
import { Email, Password } from '../../../domain/value-objects';
import { Fullname, Phone } from '../../../../shared/domain/value-objects';

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
    /** Validar entradas con los value objects */
    const email = Email.create(createAccountCommand.email);
    const password = Password.create(createAccountCommand.password);
    const fullname = Fullname.create(createAccountCommand.fullname);
    const phone = createAccountCommand.phone
      ? Phone.create(createAccountCommand.phone)
      : undefined;

    /** Validar si existe otra cuenta asociada con el correo ingresado */
    const accountExists = await this.accountRepository.verifyByEmail(
      email.toString(),
    );

    if (accountExists)
      throw new AccountAlreadyExistsException(
        'Ya existe una cuenta asociada con el correo ingresado',
      );

    /** Generar id único de cuenta y usuario */
    const accountId = this.idGenerator.generate();
    const userId = this.idGenerator.generate();

    /** Generar hash de contraseña */
    const passwordHash = await this.encryptor.hash(password.toString(), 14);

    /** Crear las instancias de dominio de la cuenta y el usuario */
    const user = User.create(
      userId,
      fullname.toString(),
      createAccountCommand.roleId,
      undefined,
      phone?.toString(),
    );

    const account = Account.create(
      accountId,
      email.toString(),
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
