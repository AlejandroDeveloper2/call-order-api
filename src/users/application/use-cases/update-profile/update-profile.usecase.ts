/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Excepciones de aplicación */
import { UserNotFoundException } from '../../exceptions';

/** Value Objects */
import { Fullname, Phone } from '../../../../shared/domain/value-objects';

/** Commands */
import { UpdateUserCommand } from '../../commands';

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async run(
    profileId: string,
    updateUserCommand: UpdateUserCommand,
  ): Promise<void> {
    const fullname = updateUserCommand.fullname
      ? Fullname.create(updateUserCommand.fullname)
      : undefined;

    const phone = updateUserCommand.phone
      ? Phone.create(updateUserCommand.phone)
      : undefined;

    const affectedRows = await this.userRepository.updateProfile(profileId, {
      fullname: fullname?.toString(),
      phone: phone?.toString(),
    });

    if (affectedRows === 0)
      throw new UserNotFoundException(
        'El ID no corresponde a ningun usuario registrado',
      );
  }
}
