import { UpdateUserInput } from '../types';

import { TransactionContext } from '../../../shared/domain/ports';

import { User } from '../entities';

export abstract class UserRepositoryPort {
  abstract findById(profileId: string): Promise<User | null>;
  abstract create(user: User, context?: TransactionContext): Promise<void>;
  abstract updateProfile(
    userId: string,
    updateUserInput: UpdateUserInput,
  ): Promise<number>;
  abstract updateAvatar(userId: string, avatarUrl: string): Promise<number>;
  abstract activate(userId: string): Promise<number>;
  abstract deactivate(userId: string): Promise<number>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
