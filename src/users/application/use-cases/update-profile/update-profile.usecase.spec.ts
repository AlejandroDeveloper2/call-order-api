/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Errores de dominio */
import {
  InvalidFullnameException,
  InvalidPhoneException,
} from '../../../../shared/domain/exceptions';

/** Commands */
import { UpdateUserCommand } from '../../commands';

/** Excepciones de aplicación */
import { UserNotFoundException } from '../../exceptions';

/** Caso de uso */
import { UpdateProfileUseCase } from './update-profile.usecase';

type UserRepositoryMock = Pick<UserRepositoryPort, 'updateProfile'>;

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
  let userRepositoryMock: jest.Mocked<UserRepositoryMock>;

  beforeEach(() => {
    userRepositoryMock = {
      updateProfile: jest.fn(),
    };
    useCase = new UpdateProfileUseCase(
      userRepositoryMock as unknown as UserRepositoryPort,
    );

    jest.clearAllMocks();
  });

  const command: UpdateUserCommand = {
    fullname: 'Juan Pérez',
    phone: '+573001234567',
  };

  describe('run()', () => {
    it('deberia lanzar InvalidFullnameException si el nombre completo es invalido', async () => {
      //Arrange
      const invalidCommand: UpdateUserCommand = {
        fullname: 'Juan123',
        phone: '3001234567',
      };

      //Act
      const result = useCase.run('test-user-id', invalidCommand);

      //Assert
      await expect(result).rejects.toThrow(InvalidFullnameException);

      expect(userRepositoryMock.updateProfile).not.toHaveBeenCalled();
    });

    it('deberia lanzar InvalidPhoneException si el telefono es invalido', async () => {
      //Arrange
      const invalidCommand: UpdateUserCommand = {
        fullname: 'Juan Pérez',
        phone: 'invalid-phone',
      };

      //Act
      const result = useCase.run('test-user-id', invalidCommand);

      //Assert
      await expect(result).rejects.toThrow(InvalidPhoneException);

      expect(userRepositoryMock.updateProfile).not.toHaveBeenCalled();
    });

    it('debe lanzar UserNotFoundException cuando el perfil no existe', async () => {
      //Arrange
      const wrongProfileId = 'wrong-user-id';

      userRepositoryMock.updateProfile.mockResolvedValue(0);

      //Act
      const result = useCase.run(wrongProfileId, command);

      //Assert
      await expect(result).rejects.toThrow(UserNotFoundException);

      expect(userRepositoryMock.updateProfile).toHaveBeenCalledWith(
        wrongProfileId,
        expect.objectContaining(command),
      );
    });

    it('debe actualizar un perfil de usuario cuando este existe', async () => {
      //Arrange
      const profileId = 'test-user-id';

      userRepositoryMock.updateProfile.mockResolvedValue(1);

      //Act
      const result = await useCase.run(profileId, command);

      //Assert
      expect(result).toBeUndefined();

      expect(userRepositoryMock.updateProfile).toHaveBeenCalledWith(
        profileId,
        expect.objectContaining(command),
      );
    });
  });
});
