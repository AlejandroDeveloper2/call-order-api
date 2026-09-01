/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Errores de aplicación */
import { UserNotFoundException } from '../../exceptions';

export class UpdateUserAvatarUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async run(userId: string, avatarUrl: string): Promise<void> {
    const affectedRows = await this.userRepository.updateAvatar(
      userId,
      avatarUrl,
    );

    if (affectedRows === 0)
      throw new UserNotFoundException('Usuario no encontrado');
  }
}
