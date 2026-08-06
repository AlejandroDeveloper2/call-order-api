import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/** Entidad de dominio */
import { User } from '../../../domain/entities';
/** Puertos */
import {
  ROLE_REPOSITORY,
  RoleRepositoryPort,
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../../domain/ports';
/** Excepciones */
import { AppError } from '../../../../shared/domain/exceptions';
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';

/** Dtos */
import { CreateUserDto } from '../../dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async run(createUserDto: CreateUserDto): Promise<void> {
    const { accountId, roleId, fullname, phone } = createUserDto;

    const role = await this.roleRepository.findById(roleId);
    if (!role)
      throw new AppError(
        USER_ERROR_CODES.roleNotFound,
        404,
        'El ID del Rol de usuario no corresponde a un rol valido',
        true,
      );

    const userId = uuidv4();

    const user = new User(
      userId,
      fullname,
      accountId,
      roleId,
      undefined,
      phone,
    );

    await this.userRepository.create(user);
  }
}
