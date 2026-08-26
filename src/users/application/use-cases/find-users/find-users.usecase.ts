/** Tipos de dominio */
import type { PaginatedResponse } from '../../../../shared/domain/types';

/** Entidades de dominio */
import { User, UserSearchQuery } from '../../../domain/entities';

/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Commands */
import { UserQueryCommand } from '../../commands';

export class FindUsersUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}
  async run(query: UserQueryCommand): Promise<PaginatedResponse<User>> {
    const userQuery = UserSearchQuery.create(
      query.limit,
      query.offset,
      query.status,
      query.fullname,
      query.email,
      query.phone,
      query.roleId,
    );

    return await this.userRepository.find(userQuery);
  }
}
