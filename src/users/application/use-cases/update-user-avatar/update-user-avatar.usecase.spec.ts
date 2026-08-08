import { Test, TestingModule } from '@nestjs/testing';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Excepciones de dominio */
import { AppError } from '../../../../shared/domain/exceptions';

/** Caso de uso */
import { UpdateUserAvatarUseCase } from './update-user-avatar.usecase';

jest.mock('uuid', () => ({
  v4: () => 'test-user-id',
}));

describe('UpdateUserAvatarUseCase', () => {
  let useCase: UpdateUserAvatarUseCase;

  const userRepository = {
    update: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'update'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserAvatarUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
      ],
    }).compile();

    useCase = module.get(UpdateUserAvatarUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el perfil no existe', async () => {
      const profileId = 'test-user-id';
      const avatarUrl = 'avatar-url';

      userRepository.update.mockResolvedValue(0);

      await expect(useCase.run(profileId, avatarUrl)).rejects.toBeInstanceOf(
        AppError,
      );

      expect(userRepository.update).toHaveBeenCalledWith(profileId, {
        avatar: avatarUrl,
      });
    });

    it('debe actualizar el avatar cuando el usuario existe', async () => {
      const profileId = 'test-user-id';
      const avatarUrl = 'avatar-url';

      userRepository.update.mockResolvedValue(undefined);

      await expect(useCase.run(profileId, avatarUrl)).resolves.toBeUndefined();

      expect(userRepository.update).toHaveBeenCalledWith(
        profileId,
        expect.objectContaining<{ avatar?: string }>({ avatar: avatarUrl }),
      );
    });
  });
});
