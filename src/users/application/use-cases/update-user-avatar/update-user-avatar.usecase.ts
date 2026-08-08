import { Injectable, Inject } from '@nestjs/common';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Errores de dominios */
import { AppError } from '../../../../shared/domain/exceptions';
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';

@Injectable()
export class UpdateUserAvatarUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async run(userId: string, avatarUrl: string): Promise<void> {
    const affectedRows = await this.userRepository.update(userId, {
      avatar: avatarUrl,
    });

    if (affectedRows === 0)
      throw new AppError(
        USER_ERROR_CODES.userNotFound,
        404,
        'Usuario no encontrado',
        true,
      );
  }
}
