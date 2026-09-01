/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Excepciones de aplicación */
import { UserNotFoundException } from '../../exceptions';

/** Caso de uso */
import { UpdateUserAvatarUseCase } from './update-user-avatar.usecase';

type UserRepositoryMock = Pick<UserRepositoryPort, 'updateAvatar'>;

describe('UpdateUserAvatarUseCase', () => {
  let useCase: UpdateUserAvatarUseCase;
  let userRepositoryMock: jest.Mocked<UserRepositoryMock>;

  beforeEach(() => {
    userRepositoryMock = {
      updateAvatar: jest.fn(),
    };

    useCase = new UpdateUserAvatarUseCase(
      userRepositoryMock as unknown as UserRepositoryPort,
    );

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar UserNotFoundException cuando el perfil no existe', async () => {
      //Arrange
      const wrongProfileId = 'wrong-user-id';
      const avatarUrl = 'avatar-url';

      userRepositoryMock.updateAvatar.mockResolvedValue(0);

      //Act
      const result = useCase.run(wrongProfileId, avatarUrl);

      //Assert
      await expect(result).rejects.toThrow(UserNotFoundException);

      expect(userRepositoryMock.updateAvatar).toHaveBeenCalledWith(
        wrongProfileId,
        avatarUrl,
      );
    });

    it('debe actualizar el avatar cuando el usuario existe', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const avatarUrl = 'avatar-url';

      userRepositoryMock.updateAvatar.mockResolvedValue(1);

      //Act
      const result = await useCase.run(profileId, avatarUrl);

      //Assert
      expect(result).toBeUndefined();

      expect(userRepositoryMock.updateAvatar).toHaveBeenCalledWith(
        profileId,
        avatarUrl,
      );
    });
  });
});
