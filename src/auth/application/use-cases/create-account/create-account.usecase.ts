import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

/** Entidades de dominio */
import { Account } from '../../../domain/entities';
import { User } from '../../../../users/domain/entities';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../../../users/domain/ports';
import {
  TRANSACTION_MANAGER,
  type TransactionManagerPort,
} from '../../../../shared/domain/ports';
/** Errores de dominio */
import { AppError } from '../../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Dtos */
import { CreateAccountDto } from '../../dto';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManagerPort,
  ) {}

  async run(createAccountDto: CreateAccountDto): Promise<void> {
    const { fullname, phone, email, password, roleId } = createAccountDto;
    /** Validar si existe otra cuenta asociada con el correo ingresado */
    const account = await this.accountRepository.findByEmail(email);

    if (account)
      throw new AppError(
        AUTH_ERROR_CODES.accountAlreadyExists,
        409,
        'Ya existe una cuenta asociada con el correo ingresado',
        true,
      );

    /** Generar uuid de cuenta y hash de la contraseña de acceso */
    const accountId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    /** Crear la cuenta y el perfil en una transacción agnóstica */
    const newAccount = new Account(accountId, email, passwordHash, false, 0);

    await this.transactionManager.run(async (context) => {
      await this.accountRepository.create(newAccount, context);

      const userId = uuidv4();
      const user = new User(
        userId,
        fullname,
        accountId,
        roleId,
        undefined,
        phone,
      );
      await this.userRepository.create(user, context);
    });
  }
}
