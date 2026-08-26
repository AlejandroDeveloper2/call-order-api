/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Entidades de dominio */
import { User } from '../../../domain/entities';

/** Errores */
import { UserNotFoundException } from '../../exceptions';

export class FindUserByIdUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async run(profileId: string): Promise<User> {
    const user = await this.userRepository.findById(profileId);
    if (!user)
      throw new UserNotFoundException(
        'El ID de cuenta no corresponde a un usuario registrado',
      );
    return user;
  }
}
