import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/** Entidad de dominio */
import { User } from '../../../domain/entities';
/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Dtos */
import { CreateUserDto } from '../../dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async run(createUserDto: CreateUserDto): Promise<void> {
    const { accountId, roleId, fullname, phone } = createUserDto;

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
