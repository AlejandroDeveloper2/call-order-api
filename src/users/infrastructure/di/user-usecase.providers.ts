import { Provider } from '@nestjs/common';

import {
  FindUserByIdUseCase,
  FindUsersUseCase,
  UpdateProfileUseCase,
  UpdateUserAvatarUseCase,
  UpdateUserStatusUseCase,
} from '../../application/use-cases';

import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports';

export const USER_USE_CASE_PROVIDERS: Provider[] = [
  {
    provide: FindUserByIdUseCase,

    useFactory: (userRepository: UserRepositoryPort) => {
      return new FindUserByIdUseCase(userRepository);
    },

    inject: [USER_REPOSITORY],
  },
  {
    provide: FindUsersUseCase,

    useFactory: (userRepository: UserRepositoryPort) => {
      return new FindUsersUseCase(userRepository);
    },

    inject: [USER_REPOSITORY],
  },
  {
    provide: UpdateUserAvatarUseCase,

    useFactory: (userRepository: UserRepositoryPort) => {
      return new UpdateUserAvatarUseCase(userRepository);
    },

    inject: [USER_REPOSITORY],
  },

  {
    provide: UpdateProfileUseCase,

    useFactory: (userRepository: UserRepositoryPort) => {
      return new UpdateProfileUseCase(userRepository);
    },

    inject: [USER_REPOSITORY],
  },

  {
    provide: UpdateUserStatusUseCase,

    useFactory: (userRepository: UserRepositoryPort) => {
      return new UpdateUserStatusUseCase(userRepository);
    },

    inject: [USER_REPOSITORY],
  },
];
