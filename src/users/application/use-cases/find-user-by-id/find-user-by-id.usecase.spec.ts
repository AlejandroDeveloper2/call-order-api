/** Entidades */
import { User } from '../../../domain/entities';

/** Puertos */
import { UserRepositoryPort } from '../../../domain/ports';

/** Casos de uso */
import { FindUserByIdUseCase } from './find-user-by-id.usecase';

/** Excepciones de aplicación */
import { UserNotFoundException } from '../../exceptions';

type UserRepositoryMock = Pick<UserRepositoryPort, 'findById'>;

describe('FindUserByIdUseCase', () => {
  let useCase: FindUserByIdUseCase;
  let userRepositoryMock: jest.Mocked<UserRepositoryMock>;

  beforeEach(() => {
    userRepositoryMock = {
      findById: jest.fn(),
    };

    useCase = new FindUserByIdUseCase(
      userRepositoryMock as unknown as UserRepositoryPort,
    );

    jest.clearAllMocks();
  });

  const user: User = User.create(
    'test-user-id',
    'Alejo Diaz',
    'test-role-id',
    undefined,
    '+573105998799',
    true,
  );

  describe('run()', () => {
    it('debe lanzar UserNotFoundException cuando el perfil de usuario no existe', async () => {
      //Arrange
      const profileId: string = 'wrong-profile-id';

      userRepositoryMock.findById.mockResolvedValue(null);

      //Act
      const profile = useCase.run(profileId);

      //Assert
      await expect(profile).rejects.toThrow(UserNotFoundException);

      expect(userRepositoryMock.findById).toHaveBeenCalledWith(profileId);
    });

    it('debe traer un usuario cuando el profileId corresponde a un usuario registrado', async () => {
      //Arrange
      const profileId: string = 'test-user-id';

      userRepositoryMock.findById.mockResolvedValue(user);

      //Act
      const profile = await useCase.run(profileId);

      //Assert
      expect(profile).toEqual(user);

      expect(userRepositoryMock.findById).toHaveBeenCalledWith(profileId);
    });
  });
});
