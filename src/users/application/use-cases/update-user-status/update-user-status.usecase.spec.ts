/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Dtos */
import { UpdateUserStatusCommand } from '../../commands';

/** Excepciones de aplicación */
import { UserNotFoundException } from '../../exceptions';

/** Caso de uso */
import { UpdateUserStatusUseCase } from './update-user-status.usecase';

type UserRepositoryMock = Pick<UserRepositoryPort, 'deactivate' | 'activate'>;

describe('UpdateUserStatusUseCase', () => {
  let useCase: UpdateUserStatusUseCase;
  let userRepositoryMock: jest.Mocked<UserRepositoryMock>;

  beforeEach(() => {
    userRepositoryMock = {
      activate: jest.fn(),
      deactivate: jest.fn(),
    };
    useCase = new UpdateUserStatusUseCase(
      userRepositoryMock as unknown as UserRepositoryPort,
    );

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar UserNotFoundException cuando el perfil no existe en el caso de activación del perfil', async () => {
      //Arrange
      const wrongProfileId = 'wrong-user-id';
      const command: UpdateUserStatusCommand = {
        status: 'active',
      };

      userRepositoryMock.activate.mockResolvedValue(0);

      //Act
      const result = useCase.run(wrongProfileId, command);

      //Assert
      await expect(result).rejects.toThrow(UserNotFoundException);

      expect(userRepositoryMock.activate).toHaveBeenCalledWith(wrongProfileId);
      expect(userRepositoryMock.deactivate).not.toHaveBeenCalled();
    });

    it('debe lanzar UserNotFoundException cuando el perfil no existe en el caso de desactivación del perfil', async () => {
      //Arrange
      const wrongProfileId = 'wrong-user-id';
      const command: UpdateUserStatusCommand = {
        status: 'inactive',
      };

      userRepositoryMock.deactivate.mockResolvedValue(0);

      //Act
      const result = useCase.run(wrongProfileId, command);

      //Assert
      await expect(result).rejects.toThrow(UserNotFoundException);

      expect(userRepositoryMock.deactivate).toHaveBeenCalledWith(
        wrongProfileId,
      );
      expect(userRepositoryMock.activate).not.toHaveBeenCalled();
    });

    it('debe actualizar el estado de un perfil de usuario a `activo` cuando este existe', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const command: UpdateUserStatusCommand = {
        status: 'active',
      };

      userRepositoryMock.activate.mockResolvedValue(1);

      //Act
      const result = await useCase.run(profileId, command);

      //Assert
      expect(result).toBeUndefined();

      expect(userRepositoryMock.activate).toHaveBeenCalledTimes(1);

      expect(userRepositoryMock.activate).toHaveBeenCalledWith(profileId);

      expect(userRepositoryMock.deactivate).not.toHaveBeenCalled();
    });

    it('debe actualizar el estado de un perfil de usuario a `inactivo` cuando este existe', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const command: UpdateUserStatusCommand = {
        status: 'inactive',
      };

      userRepositoryMock.deactivate.mockResolvedValue(1);

      //Act
      const result = await useCase.run(profileId, command);

      //Assert
      expect(result).toBeUndefined();

      expect(userRepositoryMock.deactivate).toHaveBeenCalledTimes(1);

      expect(userRepositoryMock.deactivate).toHaveBeenCalledWith(profileId);

      expect(userRepositoryMock.activate).not.toHaveBeenCalled();
    });
  });
});
