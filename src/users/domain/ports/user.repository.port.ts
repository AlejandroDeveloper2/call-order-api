import { PaginatedResponse } from '../../../shared/domain/types';
import { UpdateUserInput } from '../types';

import { User, UserSearchQuery } from '../entities';

export abstract class UserRepositoryPort {
  abstract find(query: UserSearchQuery): Promise<PaginatedResponse<User>>;
  abstract findByAccountId(accountId: string): Promise<User | null>;
  abstract create(user: User): Promise<void>;
  abstract update(
    userId: string,
    updateUserInput: UpdateUserInput,
  ): Promise<number>;
  abstract activate(userId: string): Promise<number>;
  abstract deactivate(userId: string): Promise<number>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
