import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports';

/** Excepciones */
import { AppError } from '../../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Dto */
import { ChangePasswordDto } from '../../dto';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async run(
    accountId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    /** Obtenemos la cuenta por ID */
    const account = await this.accountRepository.findById(accountId);

    if (!account)
      throw new AppError(
        AUTH_ERROR_CODES.accountNotFound,
        404,
        'Cuenta no encontrada',
        true,
      );

    /** Validar si la contraseña actual coincide con la almacenada en db */
    const isCorrectPassword = await bcrypt.compare(
      currentPassword,
      account.passwordHash,
    );

    if (!isCorrectPassword)
      throw new AppError(
        AUTH_ERROR_CODES.incorrectPassword,
        400,
        'Contraseña actual incorrecta',
        true,
      );

    /** Encriptamos la nueva contraseña  y la actualizamos */
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await this.accountRepository.update(accountId, {
      passwordHash: newPasswordHash,
    });
  }
}
