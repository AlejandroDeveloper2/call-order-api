import { Inject, Injectable } from '@nestjs/common';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';
/** Excepciones de dominio */
import { AppError } from '../../../../shared/domain/exceptions';
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';

/** Dtos */
import { UpdateUserDto } from '../../dto';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async run(profileId: string, updateUserDto: UpdateUserDto): Promise<void> {
    const affectedRows = await this.userRepository.update(
      profileId,
      updateUserDto,
    );

    if (affectedRows === 0)
      throw new AppError(
        USER_ERROR_CODES.userNotFound,
        404,
        'El ID no corresponde a ningun usuario registrado',
        true,
      );
  }
}
