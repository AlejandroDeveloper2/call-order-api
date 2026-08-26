import { Injectable, Inject } from '@nestjs/common';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Errores de aplicación */
import { UserNotFoundException } from '../../exceptions';

@Injectable()
export class UpdateUserAvatarUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async run(userId: string, avatarUrl: string): Promise<void> {
    const affectedRows = await this.userRepository.updateAvatar(
      userId,
      avatarUrl,
    );

    if (affectedRows === 0)
      throw new UserNotFoundException('Usuario no encontrado');
  }
}
