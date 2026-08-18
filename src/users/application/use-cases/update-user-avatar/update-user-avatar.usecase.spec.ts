import { Test, TestingModule } from '@nestjs/testing';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Excepciones de dominio */
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';

/** Caso de uso */
import { UpdateUserAvatarUseCase } from './update-user-avatar.usecase';

describe('UpdateUserAvatarUseCase', () => {
  let useCase: UpdateUserAvatarUseCase;

  const mockUserRepository = {
    update: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'update'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserAvatarUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get(UpdateUserAvatarUseCase);

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el perfil no existe', async () => {
      //Arrange
      const wrongProfileId = 'wrong-user-id';
      const avatarUrl = 'avatar-url';

      mockUserRepository.update.mockResolvedValue(0);

      //Act
      const result = useCase.run(wrongProfileId, avatarUrl);

      //Assert
      await expect(result).rejects.toMatchObject({
        name: USER_ERROR_CODES.userNotFound,
        httpCode: 404,
      });

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        wrongProfileId,
        expect.objectContaining<{ avatar?: string }>({ avatar: avatarUrl }),
      );
    });

    it('debe actualizar el avatar cuando el usuario existe', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const avatarUrl = 'avatar-url';

      mockUserRepository.update.mockResolvedValue(1);

      //Act
      const result = await useCase.run(profileId, avatarUrl);

      //Assert
      expect(result).toBeUndefined();

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        profileId,
        expect.objectContaining<{ avatar?: string }>({ avatar: avatarUrl }),
      );
    });
  });
});
