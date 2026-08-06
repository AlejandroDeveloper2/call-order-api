import { Inject, Injectable } from '@nestjs/common';

/** Tipos de dominio */
import type { PaginatedResponse } from '../../../../shared/domain/types';
/** Entidades de dominio */
import { User, UserSearchQuery } from '../../../domain/entities';
/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Dtos */
import { UserQueryDto } from '../../dto';

@Injectable()
export class FindUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}
  async run(query: UserQueryDto): Promise<PaginatedResponse<User>> {
    const { limit, offset, status, fullname, email, phone, roleId } = query;
    const userQuery = new UserSearchQuery(
      limit,
      offset,
      status,
      fullname,
      email,
      phone,
      roleId,
    );
    return await this.userRepository.find(userQuery);
  }
}
