import { Inject, Injectable } from '@nestjs/common';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';
/** Excepciones de dominio */
import { AppError } from '../../../../shared/domain/exceptions';
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';

/** Dtos */
import { UpdateUserStatusDto } from '../../dto';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async run(
    userId: string,
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<void> {
    const { status } = updateUserStatusDto;
    let affectedRows: number = 0;

    affectedRows =
      status === 'active'
        ? await this.userRepository.activate(userId)
        : await this.userRepository.deactivate(userId);

    if (affectedRows === 0)
      throw new AppError(
        USER_ERROR_CODES.userNotFound,
        404,
        'El ID no pertenece a ningun usuario registrado',
        true,
      );
  }
}
