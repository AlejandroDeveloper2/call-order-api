import { Inject, Injectable } from '@nestjs/common';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Entidades de dominio */
import { User } from '../../../domain/entities';

/** Errores */
import { AppError } from '../../../../shared/domain/exceptions';
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async run(profileId: string): Promise<User> {
    const user = await this.userRepository.findById(profileId);
    if (!user)
      throw new AppError(
        USER_ERROR_CODES.userNotFound,
        404,
        'El ID de cuenta no corresponde a un usuario registrado',
        true,
      );
    return user;
  }
}
