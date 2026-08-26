/** Tipos de dominio */
import type { PaginatedResponse } from '../../../../shared/domain/types';

/** Entidades de dominio */
import { User, UserSearchQuery } from '../../../domain/entities';

/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Value Objects */
import { Fullname, Phone } from '../../../domain/value-objects';
import { Email } from '../../../../auth/domain/value-objects';

/** Commands */
import { UserQueryCommand } from '../../commands';

export class FindUsersUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}
  async run(query: UserQueryCommand): Promise<PaginatedResponse<User>> {
    const fullname = query.fullname
      ? Fullname.create(query.fullname).toString()
      : undefined;

    const email = query.email
      ? Email.create(query.email).toString()
      : undefined;

    const phone = query.phone
      ? Phone.create(query.phone).toString()
      : undefined;

    const userQuery = UserSearchQuery.create(
      query.limit,
      query.offset,
      query.status,
      fullname,
      email,
      phone,
      query.roleId,
    );

    return await this.userRepository.find(userQuery);
  }
}
