/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Excepciones de dominio */
import { UserNotFoundException } from '../../exceptions';

/** Commands */
import { UpdateUserStatusCommand } from '../../commands';

export class UpdateUserStatusUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async run(
    userId: string,
    updateUserStatusCommand: UpdateUserStatusCommand,
  ): Promise<void> {
    const { status } = updateUserStatusCommand;
    let affectedRows: number = 0;

    affectedRows =
      status === 'active'
        ? await this.userRepository.activate(userId)
        : await this.userRepository.deactivate(userId);

    if (affectedRows === 0)
      throw new UserNotFoundException(
        'El ID no pertenece a ningun usuario registrado',
      );
  }
}
