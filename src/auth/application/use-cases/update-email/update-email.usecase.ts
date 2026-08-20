import { Inject, Injectable } from '@nestjs/common';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports';

/** Excepciones */
import { AppError } from '../../../../shared/domain/exceptions';
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Dtos */
import { UpdateEmailDto } from '../../dto';

@Injectable()
export class UpdateEmailUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async run(accountId: string, updateEmailDto: UpdateEmailDto): Promise<void> {
    const { updatedEmail } = updateEmailDto;

    const affectedRows = await this.accountRepository.update(accountId, {
      email: updatedEmail,
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
