import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports';

/** Excepciones */
import { AppError } from '../../../../shared/domain/exceptions';
/** Códigos de error */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Dtos */
import { UpdatePasswordDto } from '../../dto';

@Injectable()
export class UpdatePasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async run(
    accountId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const { newPassword } = updatePasswordDto;

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const affectedRows = await this.accountRepository.update(accountId, {
      passwordHash,
    });

    if (affectedRows === 0)
      throw new AppError(
        AUTH_ERROR_CODES.accountNotFound,
        404,
        'Cuenta no encontrada',
        true,
      );
  }
}
